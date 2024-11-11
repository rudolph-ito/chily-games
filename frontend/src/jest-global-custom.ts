// @ts-expect-error setImmediate has different interface but this is sufficient
global.setImmediate = global.setTimeout;
