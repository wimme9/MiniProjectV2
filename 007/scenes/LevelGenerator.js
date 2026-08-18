// scenes/LevelGenerator.js
// Procedurally generates a new, randomized level layout every time it's
// called (used on Start, Replay AND Restart, so every playthrough differs).
// Difficulty (spike frequency, platform density, flat-run length) ramps up
// the further along the level you go, split into 3 tiers. Pit width is a
// single fixed size per tier (tier.gapWidth) - no min/max range - so every
// gap in a given difficulty band always reads and jumps the same way.
//
// No-overlap rules enforced throughout:
//  - a floating platform is only placed if it fits ENTIRELY inside the
//    flat run that spawned it (it can never spill into the next pit)
//  - a spike and a platform placed in the same run are kept a minimum
//    horizontal distance apart
//  - a ground coin is kept a minimum horizontal distance from any spike
//    in the same run
//  - checkpoints are snapped away from both pits AND spikes
//
// This file has NO Phaser dependency - it only returns plain data, so it
// can be unit-tested with plain Node if needed.

function randInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}
function randFloat(min, max) {
  return Math.random() * (max - min) + min;
}
function chance(p) {
  return Math.random() < p;
}

function pickTier(progressRatio, tiers) {
  for (const tier of tiers) {
    if (progressRatio <= tier.untilRatio) return tier;
  }
  return tiers[tiers.length - 1];
}

/**
 * @param {object} cfg  the "levelGen" block from gameData.json
 * @returns {object} level data: worldWidth, ground, pits, platforms,
 *                    coins, bonusCoins, spikes, checkpoints, goal
 */
function generateLevel(cfg) {
  const levelLength = randInt(cfg.levelLengthMin, cfg.levelLengthMax);
  const groundY = cfg.groundY;

  // Exactly 3 fixed coin "planes", so pickup height always reads clearly:
  //  1) ground level        - regular coins, easy, no jump needed
  //  2) low floating platform - regular coins, small jump needed
  //  3) high floating platform - bonus coins, near max jump height (risk/reward)
  const GROUND_COIN_Y = groundY - 40;
  const LOW_PLATFORM_Y = groundY - 95;
  const HIGH_PLATFORM_Y = groundY - 145; // stays under the ~150px max jump apex

  const ground = [];
  const pits = [];
  const platforms = [];
  const coins = [];
  const bonusCoins = [];
  const spikes = [];

  let x = 0;
  let segmentStartX = 0;
  let justLandedFromPit = false;

  const closeGroundSegment = (endX) => {
    if (endX > segmentStartX) {
      ground.push({ x: segmentStartX, y: groundY, width: endX - segmentStartX, height: 40 });
    }
  };

  // --- Start safe zone: no hazards, just a couple of coins to get moving ---
  const startSafe = cfg.startSafeZone;
  coins.push({ x: 140, y: GROUND_COIN_Y });
  coins.push({ x: 200, y: GROUND_COIN_Y });
  x = startSafe;

  // --- Main procedurally generated body ---
  const bodyEnd = levelLength - cfg.endSafeZone;

  while (x < bodyEnd) {
    const progress = x / levelLength;
    const tier = pickTier(progress, cfg.tiers);

    const doPit = !justLandedFromPit && chance(0.32);

    if (doPit) {
      // Close the ground we've built so far, right at the pit's edge
      closeGroundSegment(x);

      const gap = tier.gapWidth;
      pits.push({ x, width: gap });

      // Wide gaps get a stepping-stone platform near the middle so the
      // jump is always makeable even at max difficulty.
      if (gap > 150) {
        platforms.push({
          x: x + gap / 2 - 32,
          y: groundY - 16,
          width: 64,
          height: 20
        });
      }

      x += gap;
      segmentStartX = x;
      justLandedFromPit = true;
      continue;
    }

    // --- Flat run segment ---
    const flatLen = randInt(tier.flatMin, tier.flatMax);
    const segEnd = Math.min(x + flatLen, bodyEnd);

    // Decide the spike for this run (if any) before placing anything else,
    // so the coin AND the platform can both be kept a safe distance from
    // it. Same gating as before (never right after a pit landing, gated by
    // spikeChance, needs a 140px-minimum run) - just computed earlier so
    // everything below knows where it will land.
    const MIN_COIN_SPIKE_DIST = 60;
    const MIN_PLATFORM_SPIKE_DIST = 50;
    const willHaveSpike = !justLandedFromPit && chance(tier.spikeChance) && segEnd - x > 140;
    const spikeX = willHaveSpike ? (x + segEnd) / 2 : null;

    // Ground-level coin: sparse, at most 1 per run, fixed height (level 1)
    if (segEnd - x > 100 && chance(cfg.groundCoinChance)) {
      let coinX = randFloat(x + 40, segEnd - 40);
      if (spikeX !== null && Math.abs(coinX - spikeX) < MIN_COIN_SPIKE_DIST) {
        // Too close to the spike - push it to whichever side of the spike
        // still fits inside this run, instead of re-rolling blindly.
        coinX = coinX < spikeX
          ? Math.max(x + 40, spikeX - MIN_COIN_SPIKE_DIST)
          : Math.min(segEnd - 40, spikeX + MIN_COIN_SPIKE_DIST);
      }
      // If the run is too short to fit both with the minimum gap, skip the
      // coin this time rather than spawn it next to the spike.
      if (spikeX === null || Math.abs(coinX - spikeX) >= MIN_COIN_SPIKE_DIST) {
        coins.push({ x: coinX, y: GROUND_COIN_Y });
      }
    }

    // Occasionally add ONE floating platform above this run, on one of the
    // two fixed height tiers - low (level 2, regular coin) or high
    // (level 3, bonus coin). Never both on the same run, keeping the 3
    // planes visually distinct instead of a random scatter of heights.
    //
    // The platform's width is picked FIRST and clamped to what the run can
    // actually hold (with a 40px margin on each side), so its placement
    // range is only computed from widths that are guaranteed to fit. If
    // the run is too narrow for even the smallest platform, it's skipped
    // entirely instead of spilling past segEnd into the next pit/segment.
    const PLATFORM_MARGIN = 40;
    const availableForPlatform = (segEnd - x) - PLATFORM_MARGIN * 2;
    if (availableForPlatform >= 80 && chance(tier.platformChance)) {
      const platW = randInt(80, Math.min(128, Math.floor(availableForPlatform)));
      const minPlatX = x + PLATFORM_MARGIN;
      const maxPlatX = segEnd - PLATFORM_MARGIN - platW;

      // Keep the platform's horizontal span clear of the spike, same idea
      // as the coin-vs-spike rule above: shift to whichever side still
      // fits, or drop the platform this run if there's no room for both.
      let platX = randFloat(minPlatX, Math.max(minPlatX, maxPlatX));
      let placePlatform = true;
      if (spikeX !== null) {
        const platCenter = platX + platW / 2;
        if (Math.abs(platCenter - spikeX) < MIN_PLATFORM_SPIKE_DIST + platW / 2) {
          const leftX = spikeX - MIN_PLATFORM_SPIKE_DIST - platW;
          const rightX = spikeX + MIN_PLATFORM_SPIKE_DIST;
          if (rightX <= maxPlatX) platX = rightX;
          else if (leftX >= minPlatX) platX = leftX;
          else placePlatform = false;
        }
      }

      if (placePlatform) {
        const isHigh = chance(0.5);
        const platY = isHigh ? HIGH_PLATFORM_Y : LOW_PLATFORM_Y;
        platforms.push({ x: platX, y: platY, width: platW, height: 24 });

        if (isHigh) {
          bonusCoins.push({ x: platX + platW / 2, y: platY - 30 });
        } else {
          coins.push({ x: platX + platW / 2, y: platY - 30 });
        }
      }
    }

    // Spike placement: never right after a pit landing (needs clear ground)
    if (willHaveSpike) {
      spikes.push({ x: spikeX, y: groundY - 16 });
    }

    x = segEnd;
    justLandedFromPit = false;
  }

  // --- End safe zone + goal ---
  closeGroundSegment(x);
  ground.push({ x, y: groundY, width: levelLength - x, height: 40 });
  const goal = { x: levelLength - 60, y: groundY - 60 };

  // --- Checkpoints: spaced roughly evenly, snapped onto solid ground and
  // kept clear of both pits and spikes ---
  const MIN_CHECKPOINT_SPIKE_DIST = 70;
  const isInsidePit = (px) => pits.some(p => px >= p.x && px <= p.x + p.width);
  const isNearSpike = (px) => spikes.some(s => Math.abs(px - s.x) < MIN_CHECKPOINT_SPIKE_DIST);
  const isBlocked = (px) => isInsidePit(px) || isNearSpike(px);
  const snapToGround = (targetX) => {
    let offset = 0;
    while (offset < 400) {
      if (targetX + offset < levelLength && !isBlocked(targetX + offset)) return targetX + offset;
      if (targetX - offset > 0 && !isBlocked(targetX - offset)) return targetX - offset;
      offset += 10;
    }
    return targetX;
  };

  const checkpoints = [];
  const ratios = cfg.checkpointCount === 1 ? [0.5]
    : cfg.checkpointCount === 2 ? [0.35, 0.7]
    : [0.25, 0.5, 0.75];
  ratios.forEach(r => {
    const cx = snapToGround(Math.floor(levelLength * r));
    checkpoints.push({ x: cx, y: groundY - 40 });
  });

  return {
    worldWidth: levelLength,
    ground,
    pits,
    platforms,
    coins,
    bonusCoins,
    spikes,
    checkpoints,
    goal
  };
}

// Expose for both browser (<script>) and Node (unit testing) use.
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { generateLevel };
}