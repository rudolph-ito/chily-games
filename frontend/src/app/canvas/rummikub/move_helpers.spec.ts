import { attemptMoveGroup } from "./move_helpers";

const ROW_SIZE = 10;

interface Example {
  description: string;
  input: {
    list: (string | null)[];
    firstItemOldIndex: number;
    firstItemNewIndex: number;
    groupSize: number;
  };
  output: {
    list: (string | null)[];
    success: boolean;
  };
  focus?: boolean; // used to more easily test specific examples
}

// prettier-ignore
let examples: Example[] = [
  {
    description: 'move single tile to empty row',
    input: {
      list: [
        null, null, null, null, null, null, null, null, null, null,
        null,  'a', null, null, null, null, null, null, null, null
      ],
      firstItemOldIndex: 11,
      firstItemNewIndex: 4,
      groupSize: 1
    },
    output: {
      list: [
        null, null, null, null,  'a', null, null, null, null, null,
        null, null, null, null, null, null, null, null, null, null
      ],
      success: true
    }
  },
  {
    description: 'move group to empty row',
    input: {
      list: [
        null, null, null, null, null, null, null, null, null, null,
        null,  'a',  'b',  'c', null, null, null, null, null, null
      ],
      firstItemOldIndex: 11,
      firstItemNewIndex: 4,
      groupSize: 3
    },
    output: {
      list: [
        null, null, null, null,  'a',  'b',  'c', null, null, null,
        null, null, null, null, null, null, null, null, null, null
      ],
      success: true
    }
  },
  {
    description: 'move group to non-empty row, displace single',
    input: {
      list: [
        null, null, null, null,  'd', null, null, null, null, null,
        null,  'a',  'b',  'c', null, null, null, null, null, null
      ],
      firstItemOldIndex: 11,
      firstItemNewIndex: 3,
      groupSize: 3
    },
    output: {
      list: [
        null, null, null,  'a',  'b',  'c', null,  'd', null, null,
        null, null, null, null, null, null, null, null, null, null
      ],
      success: true
    }
  },
  {
    description: 'move group to non-empty row, displace group',
    input: {
      list: [
        null, null, null, null,  'd',  'e',  'f', null, null, null,
        null,  'a',  'b',  'c', null, null, null, null, null, null
      ],
      firstItemOldIndex: 11,
      firstItemNewIndex: 3,
      groupSize: 3
    },
    output: {
      list: [
        null, null, null, 'a',  'b',  'c', null,  'd',  'e',  'f',
        null, null, null, null, null, null, null, null, null, null
      ],
      success: true
    }
  },
  {
    description: 'move group to non-empty row, displace multiple groups',
    input: {
      list: [
        null, null, null, null,  'd', null,  'e', null, null, null,
        null,  'a',  'b',  'c', null, null, null, null, null, null
      ],
      firstItemOldIndex: 11,
      firstItemNewIndex: 3,
      groupSize: 3
    },
    output: {
      list: [
        null, null, null, 'a',  'b',  'c', null,  'd', null,  'e',
        null, null, null, null, null, null, null, null, null, null
      ],
      success: true
    }
  },
  {
    description: 'move group to non-empty row, connect + displace groups',
    input: {
      list: [
        null, null, null, null,  'd', null,  'e', null, null, null,
        null,  'a',  'b',  'c', null, null, null, null, null, null
      ],
      firstItemOldIndex: 11,
      firstItemNewIndex: 4,
      groupSize: 3
    },
    output: {
      list: [
        null, null, null, null,  'a',  'b',  'c',  'd', null,  'e',
        null, null, null, null, null, null, null, null, null, null
      ],
      success: true
    }
  },
  {
    description: 'move group to non-empty row, displacement too much to fix',
    input: {
      list: [
        null, null, null, null,  'd', null,  'e',  'f', null, null,
        null,  'a',  'b',  'c', null, null, null, null, null, null
      ],
      firstItemOldIndex: 11,
      firstItemNewIndex: 3,
      groupSize: 3
    },
    output: {
      list: [],
      success: false
    }
  },
  {
    description: 'move group within row and overlap (to the left)',
    input: {
      list: [
        null, null, null,  'a',  'b',  'c', null, null, null, null,
      ],
      firstItemOldIndex: 3,
      firstItemNewIndex: 1,
      groupSize: 3
    },
    output: {
      list: [
        null,  'a',  'b',  'c', null, null, null, null, null, null
      ],
      success: true
    }
  },
  {
    description: 'move group within row and overlap (to the right)',
    input: {
      list: [
        null, null, null,  'a',  'b',  'c', null, null, null, null,
      ],
      firstItemOldIndex: 3,
      firstItemNewIndex: 4,
      groupSize: 3
    },
    output: {
      list: [
        null, null, null, null, 'a',  'b',  'c', null, null, null,
      ],
      success: true
    }
  },
  {
    description: 'move group within row, displace group',
    input: {
      list: [
        null, 'd', 'e', null,  'a',  'b',  'c', null, null, null,
      ],
      firstItemOldIndex: 4,
      firstItemNewIndex: 0,
      groupSize: 3
    },
    output: {
      list: [
        'a',  'b',  'c', null, 'd', 'e', null, null, null, null
      ],
      success: true
    }
  },
  {
    description: 'move group within row, split existing group',
    input: {
      list: [
        null, 'd', 'e', null, 'a', 'b', 'c', null, null, null,
      ],
      firstItemOldIndex: 4,
      firstItemNewIndex: 2,
      groupSize: 3
    },
    output: {
      list: [
        null, 'd', 'a', 'b', 'c', 'e', null, null, null, null,
      ],
      success: true
    }
  },
  {
    description: 'move single tile, displace',
    input: {
      list: [
        null, null, null, 'a', 'b', null, null, null, null, null
      ],
      firstItemOldIndex: 3,
      firstItemNewIndex: 4,
      groupSize: 1
    },
    output: {
      list: [
        null, null, null, null, 'a', 'b', null, null, null, null
      ],
      success: true
    }
  },
  {
    description: 'move single tile, within group',
    input: {
      list: [
        null, null, null, 'b', 'a', 'c', 'd', null, null, null
      ],
      firstItemOldIndex: 4,
      firstItemNewIndex: 3,
      groupSize: 1
    },
    output: {
      list: [
        null, null, null, 'a', 'b', 'c', 'd', null, null, null
      ],
      success: true
    },
  },
  {
    description: 'move single tile to edge of row',
    input: {
      list: [
        null, null, null, null, 'a', null, null, null, null, null
      ],
      firstItemOldIndex: 4,
      firstItemNewIndex: 9,
      groupSize: 1
    },
    output: {
      list: [
        null, null, null, null, null, null, null, null, null, 'a'
      ],
      success: true
    },
    focus: true,
  }
]

const focused_examples = examples.filter((x) => x.focus);
if (focused_examples.length > 0) {
  if (process.env.CI) {
    throw new Error("Committed example focus. Please remove");
  }
  examples = focused_examples;
}

describe("attemptMoveGroup", () => {
  for (const example of examples) {
    it(example.description, () => {
      // arrange

      // act
      const result = attemptMoveGroup({
        rowSize: ROW_SIZE,
        ...example.input,
      });

      // assert
      expect(result).toEqual(example.output);
    });
  }
});
