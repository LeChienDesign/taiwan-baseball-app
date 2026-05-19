
export const APP_FONT = 'CityBurn';
export const CN_FONT = 'FangZhengHei';

export const getFont = (text?: string) => {
  if (!text) {
    return APP_FONT;
  }

  const hasChinese = /[\u3400-\u9FBF]/.test(text);

  return hasChinese ? CN_FONT : APP_FONT;
};
