// Layers repeated across several Figma frames.
import { router } from 'expo-router';

import { icons } from '../design/assets';
import { Box, Hit, Icon, Label, ORANGE } from '../design/canvas';

/** "상세 보기" outline button on the right of a store row. */
export function DetailButton({ y, onPress }: { y: number; onPress: () => void }) {
  return (
    <>
      <Box x={303} y={y} w={75} h={27} radius={12} border={[1.2, ORANGE]} onPress={onPress} />
      <Label cx={341} y={y + 4} size={16} weight="SemiBold" color={ORANGE}>
        상세 보기
      </Label>
    </>
  );
}

/** White top bar with a back arrow and title (17-5, 17-8). */
export function BackHeader({ title, shadow }: { title: string; shadow: [offsetY: number, color: string] }) {
  return (
    <>
      <Box x={0} y={-22} w={402} h={131} bg="#ffffff" shadow={[shadow[0], 15, shadow[1]]} />
      <Icon svg={icons.back} x={24} y={72} w={13} h={22} />
      <Label x={51} y={70} size={22} weight="SemiBold" color="#000000">
        {title}
      </Label>
      <Hit x={0} y={56} w={140} h={53} onPress={() => router.back()} />
    </>
  );
}

export function openStoreDetail() {
  router.push('/search/detail');
}
