import { ref, h } from '../../dist/guide-self-vue3.esm.js';

/**
 * 左侧对比
 * a b（c）
 * a b (d e）
*/
// const prevChildren = [
//   h('div', { key: 'A' }, 'A'),
//   h('div', { key: 'B' }, 'B'),
//   h('div', { key: 'C' }, 'C'),
// ];
// const nextChildren = [
//   h('div', { key: 'A' }, 'A'),
//   h('div', { key: 'B' }, 'B'),
//   h('div', { key: 'D' }, 'D'),
//   h('div', { key: 'E' }, 'E'),
// ];

/**
 * 右侧对比
 *   (a) b c
 * (d e) b c
*/
// const prevChildren = [
//   h('div', { key: 'A' }, 'A'),
//   h('div', { key: 'B' }, 'B'),
//   h('div', { key: 'C' }, 'C'),
// ];
// const nextChildren = [
//   h('div', { key: 'D' }, 'D'),
//   h('div', { key: 'E' }, 'E'),
//   h('div', { key: 'B' }, 'B'),
//   h('div', { key: 'C' }, 'C'),
// ];

/**
 * 新比老长【左侧】  创建新的
 * a b
 * a b (c d)
*/
// const prevChildren = [
//   h('div', { key: 'A' }, 'A'),
//   h('div', { key: 'B' }, 'B'),
// ];
// const nextChildren = [
//   h('div', { key: 'A' }, 'A'),
//   h('div', { key: 'B' }, 'B'),
//   h('div', { key: 'C' }, 'C'),
//   h('div', { key: 'D' }, 'D'),
// ];

/**
 * 新比老长【右侧】  创建新的
 *       a b
 * (d c) a b
*/
// const prevChildren = [
//   h('div', { key: 'A' }, 'A'),
//   h('div', { key: 'B' }, 'B'),
// ];
// const nextChildren = [
//   h('div', { key: 'D' }, 'D'),
//   h('div', { key: 'C' }, 'C'),
//   h('div', { key: 'A' }, 'A'),
//   h('div', { key: 'B' }, 'B'),
// ];

/**
 * 老比新长【左侧】  删除老的
 * a b (c)
 * a b
*/
// const prevChildren = [
//   h('div', { key: 'A' }, 'A'),
//   h('div', { key: 'B' }, 'B'),
//   h('div', { key: 'C' }, 'C'),
// ];
// const nextChildren = [
//   h('div', { key: 'A' }, 'A'),
//   h('div', { key: 'B' }, 'B'),
// ];

/**
 * 老比新长【右侧】  删除老的
 * (a) b c
 *     b c
*/
// const prevChildren = [
//   h('div', { key: 'A' }, 'A'),
//   h('div', { key: 'B' }, 'B'),
//   h('div', { key: 'C' }, 'C'),
// ];
// const nextChildren = [
//   h('div', { key: 'B' }, 'B'),
//   h('div', { key: 'C' }, 'C'),
// ];

/**
 * 中间部分不同，删老增新
 * a b (c d) f g
 * a b (e c) f g
*/
// const prevChildren = [
//   h('div', { key: 'A' }, 'A'),
//   h('div', { key: 'B' }, 'B'),
//   h('div', { key: 'C', id: 'c-prev' }, 'C'),
//   h('div', { key: 'D' }, 'D'),
//   h('div', { key: 'F' }, 'F'),
//   h('div', { key: 'G' }, 'G'),
// ];
// const nextChildren = [
//   h('div', { key: 'A' }, 'A'),
//   h('div', { key: 'B' }, 'B'),
//   h('div', { key: 'E' }, 'E'),
//   h('div', { key: 'C', id: 'c-next' }, 'C'),
//   h('div', { key: 'F' }, 'F'),
//   h('div', { key: 'G' }, 'G'),
// ];

/**
 * 中间部分不同，删老增新【优化】
 * a b (c d e) f g
 * a b (e c)   f g
*/
// const prevChildren = [
//   h('div', { key: 'A' }, 'A'),
//   h('div', { key: 'B' }, 'B'),
//   h('div', { key: 'C', id: 'c-prev' }, 'C'),
//   h('div', { key: 'D' }, 'D'),
//   h('div', { key: 'E' }, 'E'),
//   h('div', { key: 'F' }, 'F'),
//   h('div', { key: 'G' }, 'G'),
// ];
// const nextChildren = [
//   h('div', { key: 'A' }, 'A'),
//   h('div', { key: 'B' }, 'B'),
//   h('div', { key: 'E' }, 'E'),
//   h('div', { key: 'C', id: 'c-next' }, 'C'),
//   h('div', { key: 'F' }, 'F'),
//   h('div', { key: 'G' }, 'G'),
// ];

/**
 * 中间部分不同 ———— 位置调换
 * a b (c d e) f g
 * a b (e c d) f g
*/
// const prevChildren = [
//   h('div', { key: 'A' }, 'A'),
//   h('div', { key: 'B' }, 'B'),
//   h('div', { key: 'C', id: 'c-prev' }, 'C'),
//   h('div', { key: 'D' }, 'D'),
//   h('div', { key: 'E' }, 'E'),
//   h('div', { key: 'F' }, 'F'),
//   h('div', { key: 'G' }, 'G'),
// ];
// const nextChildren = [
//   h('div', { key: 'A' }, 'A'),
//   h('div', { key: 'B' }, 'B'),
//   h('div', { key: 'E' }, 'E'),
//   h('div', { key: 'C', id: 'c-next' }, 'C'),
//   h('div', { key: 'D' }, 'D'),
//   h('div', { key: 'F' }, 'F'),
//   h('div', { key: 'G' }, 'G'),
// ];

/**
 * 中间部分不同 ———— 增加新节点
 * a b c     e f g
 * a b c (d) e f g
*/
// const prevChildren = [
//   h('div', { key: 'A' }, 'A'),
//   h('div', { key: 'B' }, 'B'),
//   h('div', { key: 'C' }, 'C'),
//   h('div', { key: 'E' }, 'E'),
//   h('div', { key: 'F' }, 'F'),
//   h('div', { key: 'G' }, 'G'),
// ];
// const nextChildren = [
//   h('div', { key: 'A' }, 'A'),
//   h('div', { key: 'B' }, 'B'),
//   h('div', { key: 'C' }, 'C'),
//   h('div', { key: 'D' }, 'D'),
//   h('div', { key: 'E' }, 'E'),
//   h('div', { key: 'F' }, 'F'),
//   h('div', { key: 'G' }, 'G'),
// ];

/**
 * 综合例子
 * a b (c d e z) f g
 * a b (d c y e) f g
*/
const prevChildren = [
  h('div', { key: 'A' }, 'A'),
  h('div', { key: 'B' }, 'B'),
  h('div', { key: 'C' }, 'C'),
  h('div', { key: 'D' }, 'D'),
  h('div', { key: 'E' }, 'E'),
  h('div', { key: 'Z' }, 'Z'),
  h('div', { key: 'F' }, 'F'),
  h('div', { key: 'G' }, 'G'),
];
const nextChildren = [
  h('div', { key: 'A' }, 'A'),
  h('div', { key: 'B' }, 'B'),
  h('div', { key: 'D' }, 'D'),
  h('div', { key: 'C' }, 'C'),
  h('div', { key: 'Y' }, 'Y'),
  h('div', { key: 'E' }, 'E'),
  h('div', { key: 'F' }, 'F'),
  h('div', { key: 'G' }, 'G'),
];

export default {
  name: 'ArrayToText',
  setup() {
    const isChange = ref(false);
    window.isChange = isChange;

    return { isChange };
  },
  render() {
    const self = this;

    return self.isChange === true
      ? h('div', {}, nextChildren)
      : h('div', {}, prevChildren);
  },
}