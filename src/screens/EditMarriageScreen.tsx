import React, { useState } from 'react';
import { View, Text, ScrollView, Alert } from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import type { RouteProp } from '@react-navigation/native';
import { useFamily } from '../context/FamilyContext';
import { formatDateISO, parseDate } from '../utils/date';
import { ScreenHeader } from '../components/ui/ScreenHeader';
import { Button } from '../components/ui/Button';
import { DatePickerField } from '../components/ui/DatePickerField';
import { useTranslation } from 'react-i18next';
import { formStyles } from '../theme/formStyles';
import { spacing } from '../theme/spacing';

type RouteParams = { EditMarriage: { marriageId: string } };

export function EditMarriageScreen() {
  const { t } = useTranslation();
  const route = useRoute<RouteProp<RouteParams, 'EditMarriage'>>();
  const navigation = useNavigation();
  const { state, dispatch } = useFamily();

  const marriage = state.marriages.find((m) => m.id === route.params.marriageId);
  const [marriageDate, setMarriageDate] = useState<Date | null>(
    marriage ? parseDate(marriage.marriageDate) : null,
  );
  const [divorceDate, setDivorceDate] = useState<Date | null>(
    marriage ? parseDate(marriage.divorceDate) : null,
  );

  if (!marriage) {
    return (
      <View style={formStyles.container}>
        <Text style={formStyles.notFound}>{t('editMarriage.notFound')}</Text>
      </View>
    );
  }

  const spouse1 = state.people.find((p) => p.id === marriage.spouse1Id);
  const spouse2 = state.people.find((p) => p.id === marriage.spouse2Id);
  const coupleName = [spouse1, spouse2]
    .map((p) => (p ? `${p.firstName} ${p.lastName}` : t('history.actions.unknownPerson')))
    .join(' ⚭ ');

  const handleSave = () => {
    if (marriageDate && divorceDate && divorceDate < marriageDate) {
      Alert.alert(t('common.error'), t('editMarriage.errorDivorceBeforeMarriage'));
      return;
    }
    dispatch({
      type: 'UPDATE_MARRIAGE',
      payload: {
        ...marriage,
        marriageDate: marriageDate ? formatDateISO(marriageDate) : null,
        divorceDate: divorceDate ? formatDateISO(divorceDate) : null,
      },
    });
    navigation.goBack();
  };

  const handleRemove = () => {
    Alert.alert(t('personDetail.removeRelationshipTitle'), t('personDetail.removeRelationshipBody'), [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('common.delete'),
        style: 'destructive',
        onPress: () => {
          dispatch({ type: 'REMOVE_RELATIONSHIP', payload: { id: marriage.id, kind: 'marriage' } });
          navigation.goBack();
        },
      },
    ]);
  };

  return (
    <ScrollView
      style={formStyles.container}
      contentContainerStyle={formStyles.content}
      keyboardShouldPersistTaps="handled"
    >
      <ScreenHeader title={t('editMarriage.title')} subtitle={coupleName} />

      <View style={formStyles.form}>
        <DatePickerField
          testID="picker-marriage-date"
          label={t('editMarriage.marriageDateLabel')}
          value={marriageDate}
          onChange={setMarriageDate}
          clearLabel={t('editMarriage.clearMarriageDate')}
        />

        <DatePickerField
          testID="picker-divorce-date"
          label={t('editMarriage.divorceDateLabel')}
          value={divorceDate}
          onChange={setDivorceDate}
          clearLabel={t('editMarriage.clearDivorceDate')}
        />

        <View style={{ marginTop: spacing.lg }}>
          <Button testID="btn-save-marriage" title={t('editMarriage.save')} onPress={handleSave} />
        </View>
        <View style={{ marginTop: spacing.sm }}>
          <Button
            testID="btn-remove-marriage"
            title={t('editMarriage.remove')}
            onPress={handleRemove}
            variant="ghost"
          />
        </View>
      </View>
    </ScrollView>
  );
}
