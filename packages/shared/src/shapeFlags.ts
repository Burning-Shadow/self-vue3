/**
 * |: 均为 0 则为 0 ———— 修改
 * &: 均为 1 则为 1 ———— 查找
*/
export enum SHAPE_FLAGS {
  ELEMENT = 1,                 // 00001
  STATEFUL_COMPONENT = 1 << 1, // 00010
  TEXT_CHILDREN = 1 << 2,      // 00100
  ARRAY_CHILDREN = 1 << 3,     // 01000
  SLOT_CHILDREN = 1 << 4,      // 10000
};
