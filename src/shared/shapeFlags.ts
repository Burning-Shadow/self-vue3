/**
 * |: 均为 0 则为 0 ———— 修改
 * &: 均为 1 则为 1 ———— 查找
*/
export enum SHAPE_FLAGS {
  ELEMENT = 1,                 // 0001
  STATEFUL_COMPONENT = 1 << 1, // 0010
  TEXT_CHILDREN = 1 << 2,      // 0100
  ARRAY_CHILDREN = 1 << 3,     // 1000
};
