import type { ImageSourcePropType } from 'react-native';

const localAbroadPhotos: Record<string, ImageSourcePropType> = {
  'an-ko-lin': require('../assets/abroad/an-ko-lin.png'),
  'chia-cheng-lin': require('../assets/abroad/chia-cheng-lin.png'),
  'chia-hao-song': require('../assets/abroad/chia-hao-song.png'),
  'chia-hao-sung': require('../assets/abroad/chia-hao-song.png'),
  'sung-chia-hao': require('../assets/abroad/chia-hao-song.png'),
  'chih-jung-liu': require('../assets/abroad/chih-jung-liu.png'),
  'chen-wei-lin': require('../assets/abroad/chen-wei-lin.png'),
  'chen-zhong-ao-zhuang': require('../assets/abroad/chen-zhong-ao-zhuang.png'),
  'ching-hsien-ko': require('../assets/abroad/ching-hsien-ko.png'),
  'chun-wei-chang': require('../assets/abroad/chun-wei-chang.png'),
  'chung-hsiang-huang': require('../assets/abroad/chung-hsiang-huang.png'),
  'huang-chung-hsiang': require('../assets/abroad/chung-hsiang-huang.png'),
  'corbin-carroll': require('../assets/abroad/corbin-carroll.png'),
  'hao-yu-lee': require('../assets/abroad/hao-yu-lee.png'),
  'hung-ling-chang': require('../assets/abroad/hung-ling-chang.png'),
  'jo-hsi-hsu': require('../assets/abroad/jo-hsi-hsu.png'),
  'jonathon-long': require('../assets/abroad/jonathon-long.png'),
  'kai-wei-teng': require('../assets/abroad/kai-wei-teng.png'),
  'po-yu-chen': require('../assets/abroad/po-yu-chen.png'),
  'ruei-yang-gu-lin': require('../assets/abroad/ruei-yang-gu-lin.png'),
  'sheng-en-lin': require('../assets/abroad/sheng-en-lin.png'),
  'shosei-hsu': require('../assets/abroad/Shosei徐翔聖.png'),
  'hsiang-sheng-hsu': require('../assets/abroad/Shosei徐翔聖.png'),
  'stuart-fairchild': require('../assets/abroad/stuart-fairchild.png'),
  'tsung-che-cheng': require('../assets/abroad/tsung-che-cheng.png'),
  'tzu-chen-sha': require('../assets/abroad/tzu-chen-sha.png'),
  'wei-en-lin': require('../assets/abroad/wei-en-lin.png'),
  'wen-hui-pan': require('../assets/abroad/wen-hui-pan.png'),
  'yen-cheng-wang': require('../assets/abroad/yen-cheng-wang.png'),
  'yi-lei-sun': require('../assets/abroad/yi-lei-sun.png'),
  'yu-min-lin': require('../assets/abroad/yu-min-lin.png'),
};

export function getAbroadPlayerPhotoSource(playerId?: string | null) {
  if (!playerId) {
    return undefined;
  }

  return localAbroadPhotos[playerId];
}
