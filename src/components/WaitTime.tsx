// "124번째" / "2시간 9분" — big orange numbers followed by black units.
// The values change while waiting, so the pieces are laid out inline with
// the spacing measured from the 17-4 frame (units sit 9px lower than the
// numbers).
import { Fragment } from 'react';
import { Text, View } from 'react-native';

import { font, ORANGE, useScale } from '../design/canvas';

type Part = {
  value: number | string;
  unit: string;
  /** Space before the number and before the unit, in design px. */
  gapBefore?: number;
  unitGap?: number;
};

export function BigNumbers({ x, y, parts }: { x: number; y: number; parts: Part[] }) {
  const s = useScale();
  return (
    <View
      pointerEvents="none"
      style={{ position: 'absolute', left: x * s, top: y * s, flexDirection: 'row', alignItems: 'flex-start' }}
    >
      {parts.map((part, i) => (
        <Fragment key={i}>
          <Text
            allowFontScaling={false}
            style={{
              marginLeft: (part.gapBefore ?? 0) * s,
              fontFamily: font('SemiBold'),
              fontSize: 36 * s,
              color: ORANGE,
              includeFontPadding: false,
            }}
          >
            {part.value}
          </Text>
          <Text
            allowFontScaling={false}
            style={{
              marginTop: 9 * s,
              marginLeft: (part.unitGap ?? 0) * s,
              fontFamily: font('SemiBold'),
              fontSize: 24 * s,
              color: '#000000',
              includeFontPadding: false,
            }}
          >
            {part.unit}
          </Text>
        </Fragment>
      ))}
    </View>
  );
}

export function positionParts(position: number): Part[] {
  return [{ value: position, unit: '번째', unitGap: 2.1 }];
}

export function waitParts(hours: number, minutes: number): Part[] {
  return hours > 0
    ? [
        { value: hours, unit: '시간', unitGap: 0.3 },
        { value: minutes, unit: '분', gapBefore: 3.5, unitGap: 0.2 },
      ]
    : [{ value: minutes, unit: '분', unitGap: 0.2 }];
}
