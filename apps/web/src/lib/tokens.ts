/**
 * NCN Academy — Design Tokens
 * Nguon duy nhat cho tat ca mau sac.
 * Them mau moi o day TRUOC khi dung trong component.
 */

export const colors = {
  purple:     '#635bff',
  purpleDark: '#5248e8',
  purpleLight:'#a78bfa',
  orange:     '#f97316',
  orangeDark: '#ea580c',
  black:      '#111111',
  black2:     '#1a1a1a',
  black3:     '#222222',
  gray:       '#888888',
  grayLight:  '#cccccc',
} as const;

export type ColorToken = keyof typeof colors;
