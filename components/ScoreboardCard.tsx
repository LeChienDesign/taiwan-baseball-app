import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Image, Animated, Easing } from 'react-native';

type TeamInfo = {
  name: string;
  short?: string;
  record?: string;
  logo?: any;
};

type LineScoreRow = {
  team?: string;
  innings?: (number | string)[];
  r?: number;
  h?: number;
  e?: number;
};

type ScoreboardCardProps = {
  status: 'FINAL' | 'LIVE' | 'SCHEDULED' | string;
  venue?: string;
  awayTeam: TeamInfo;
  homeTeam: TeamInfo;
  awayScore?: number;
  homeScore?: number;
  innings?: number[];
  awayLine?: LineScoreRow;
  homeLine?: LineScoreRow;
  footerLeft?: string;
  footerRight?: string;
};

function getTeamShort(team: TeamInfo) {
  if (team.short && team.short.trim()) return team.short;
  if (team.name && team.name.trim()) return team.name.slice(0, 3).toUpperCase();
  return 'TEAM';
}

function normalizeInnings(source: unknown): (number | string)[] {
  if (!Array.isArray(source)) return [];
  return source.map((v) => (v === null || v === undefined || v === '' ? '-' : v));
}

function buildInningHeaders(
  innings?: number[],
  awayInnings?: (number | string)[],
  homeInnings?: (number | string)[]
) {
  if (Array.isArray(innings) && innings.length > 0) {
    return innings;
  }

  const maxLength = Math.max(awayInnings?.length ?? 0, homeInnings?.length ?? 0, 9);
  return Array.from({ length: maxLength }, (_, i) => i + 1);
}

function padLine(values: (number | string)[], targetLength: number) {
  if (values.length >= targetLength) return values;
  return [...values, ...Array.from({ length: targetLength - values.length }, () => '-')];
}

function normalizeStatus(status: ScoreboardCardProps['status']) {
  const raw = String(status || '').toUpperCase();

  if (raw.includes('LIVE') || raw.includes('比賽中')) return 'LIVE';
  if (raw.includes('FINAL') || raw.includes('結束') || raw.includes('完賽')) return 'FINAL';
  return 'SCHEDULED';
}

function getStatusLabel(status: string, footerLeft?: string, footerRight?: string) {
  if (status === 'LIVE') return footerLeft || footerRight || 'LIVE';
  if (status === 'FINAL') return 'FINAL';
  return footerRight || 'SCHEDULED';
}

function hasLineScoreData(awayInnings: (number | string)[], homeInnings: (number | string)[]) {
  return awayInnings.some((v) => v !== '-') || homeInnings.some((v) => v !== '-');
}

function TeamLogo({ team }: { team: TeamInfo }) {
  if (team.logo) {
    return <Image source={team.logo} style={styles.teamLogo} resizeMode="contain" />;
  }

  return (
    <View style={styles.teamLogoFallback}>
      <Text style={styles.teamLogoFallbackText}>{getTeamShort(team)}</Text>
    </View>
  );
}

export default function ScoreboardCard({
  status,
  venue = '',
  awayTeam,
  homeTeam,
  awayScore = 0,
  homeScore = 0,
  innings,
  awayLine,
  homeLine,
  footerLeft,
  footerRight,
}: ScoreboardCardProps) {
  const normalizedStatus = normalizeStatus(status);
  const isScheduled = normalizedStatus === 'SCHEDULED';
  const isLive = normalizedStatus === 'LIVE';
  const isFinal = normalizedStatus === 'FINAL';
  const livePulse = useRef(new Animated.Value(1)).current;
  const awayScorePulse = useRef(new Animated.Value(1)).current;
  const homeScorePulse = useRef(new Animated.Value(1)).current;
  const awayFlash = useRef(new Animated.Value(0)).current;
  const homeFlash = useRef(new Animated.Value(0)).current;
  const previousAwayScore = useRef(awayScore);
  const previousHomeScore = useRef(homeScore);

  const awayWin = isFinal && awayScore > homeScore;
  const homeWin = isFinal && homeScore > awayScore;
  const footerVenue = venue && venue !== '—' ? venue : '';
  const statusLabel = getStatusLabel(normalizedStatus, footerLeft, footerRight);
  const liveDetail = isLive ? statusLabel : footerRight;

  useEffect(() => {
    if (!isLive) {
      livePulse.setValue(1);
      return;
    }

    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(livePulse, {
          toValue: 1.45,
          duration: 620,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(livePulse, {
          toValue: 1,
          duration: 620,
          easing: Easing.in(Easing.quad),
          useNativeDriver: true,
        }),
      ])
    );

    loop.start();

    return () => {
      loop.stop();
      livePulse.setValue(1);
    };
  }, [isLive, livePulse]);

  useEffect(() => {
    if (previousAwayScore.current !== awayScore) {
      awayScorePulse.setValue(1.22);
      awayFlash.setValue(1);

      Animated.parallel([
        Animated.spring(awayScorePulse, {
          toValue: 1,
          friction: 5,
          tension: 120,
          useNativeDriver: true,
        }),
        Animated.timing(awayFlash, {
          toValue: 0,
          duration: 260,
          useNativeDriver: false,
        }),
      ]).start();

      previousAwayScore.current = awayScore;
    }

    if (previousHomeScore.current !== homeScore) {
      homeScorePulse.setValue(1.22);
      homeFlash.setValue(1);

      Animated.parallel([
        Animated.spring(homeScorePulse, {
          toValue: 1,
          friction: 5,
          tension: 120,
          useNativeDriver: true,
        }),
        Animated.timing(homeFlash, {
          toValue: 0,
          duration: 260,
          useNativeDriver: false,
        }),
      ]).start();

      previousHomeScore.current = homeScore;
    }
  }, [awayFlash, awayScore, awayScorePulse, homeFlash, homeScore, homeScorePulse]);

  const awayInningsRaw = normalizeInnings(awayLine?.innings);
  const homeInningsRaw = normalizeInnings(homeLine?.innings);
  const inningHeaders = buildInningHeaders(innings, awayInningsRaw, homeInningsRaw);

  const awayInnings = padLine(awayInningsRaw, inningHeaders.length);
  const homeInnings = padLine(homeInningsRaw, inningHeaders.length);

  const shouldShowLineScore = hasLineScoreData(awayInningsRaw, homeInningsRaw) || !isScheduled;

  const safeAwayLine = {
    team: awayLine?.team || getTeamShort(awayTeam),
    innings: awayInnings,
    r: awayLine?.r ?? awayScore ?? 0,
    h: awayLine?.h ?? 0,
    e: awayLine?.e ?? 0,
  };

  const safeHomeLine = {
    team: homeLine?.team || getTeamShort(homeTeam),
    innings: homeInnings,
    r: homeLine?.r ?? homeScore ?? 0,
    h: homeLine?.h ?? 0,
    e: homeLine?.e ?? 0,
  };

  return (
    <View style={styles.card}>
      <View style={styles.topRow}>
        <View style={styles.sideTeam}>
          <Text style={[styles.teamName, awayWin && styles.winnerText]}>{awayTeam.name}</Text>
          {!!awayTeam.record && <Text style={styles.teamRecord}>{awayTeam.record}</Text>}
        </View>

        <TeamLogo team={awayTeam} />

        <View style={styles.centerWrap}>
          {isScheduled ? (
            <>
              <View style={styles.scheduledWrap}>
                <View style={styles.scheduledPill}>
                  <Text style={styles.scheduledLabel}>SCHEDULED</Text>
                </View>
                <Text style={styles.scheduledTime}>{footerRight || '--:--'}</Text>
              </View>
            </>
          ) : (
            <>
              <View style={styles.scoreLine}>
                <Animated.Text
                  style={[
                    styles.bigScore,
                    awayWin && styles.winnerScore,
                    {
                      transform: [{ scale: awayScorePulse }],
                      color: awayFlash.interpolate({
                        inputRange: [0, 1],
                        outputRange: [awayWin ? '#facc15' : '#ffffff', '#facc15'],
                      }),
                    },
                  ]}
                >
                  {awayScore}
                </Animated.Text>

                <View style={styles.statusPillWrap}>
                  {isLive ? (
                    <View style={[styles.statusPill, styles.statusPillLive]}>
                      <Animated.View style={{ transform: [{ scale: livePulse }] }}>
                        <View style={styles.liveDot} />
                      </Animated.View>
                      <Text style={styles.statusTextLive}>LIVE</Text>
                    </View>
                  ) : isFinal ? (
                    <View style={[styles.statusPill, styles.statusPillFinal]}>
                      <Text style={styles.statusText}>FINAL</Text>
                    </View>
                  ) : (
                    <View style={styles.statusPill}>
                      <Text style={styles.statusText}>SCH</Text>
                    </View>
                  )}
                </View>

                <Animated.Text
                  style={[
                    styles.bigScore,
                    homeWin && styles.winnerScore,
                    {
                      transform: [{ scale: homeScorePulse }],
                      color: homeFlash.interpolate({
                        inputRange: [0, 1],
                        outputRange: [homeWin ? '#facc15' : '#ffffff', '#facc15'],
                      }),
                    },
                  ]}
                >
                  {homeScore}
                </Animated.Text>
              </View>
            </>
          )}
        </View>

        <TeamLogo team={homeTeam} />

        <View style={[styles.sideTeam, styles.sideTeamRight]}>
          <Text style={[styles.teamName, styles.teamNameRight, homeWin && styles.winnerText]}>{homeTeam.name}</Text>
          {!!homeTeam.record && (
            <Text style={[styles.teamRecord, styles.teamRecordRight]}>{homeTeam.record}</Text>
          )}
        </View>
      </View>

      {shouldShowLineScore && (
        <>
          <View style={styles.divider} />

          <View style={styles.statusMetaRow}>
            <Text style={styles.statusMetaText} numberOfLines={1}>
              {isLive ? statusLabel : isFinal ? '比賽結束' : statusLabel}
            </Text>
          </View>

          <View style={styles.lineTable}>
            <View style={styles.headerRow}>
              <View style={styles.teamCodeCell} />
              {inningHeaders.map((inning) => (
                <Text key={`h-${inning}`} style={styles.inningHeader}>
                  {inning}
                </Text>
              ))}
              <Text style={styles.inningHeader}>R</Text>
              <Text style={styles.inningHeader}>H</Text>
              <Text style={styles.inningHeader}>E</Text>
            </View>

            <View style={[styles.scoreRow, awayWin && styles.scoreRowWinner]}>
              <Text style={styles.teamCodeCellText}>{safeAwayLine.team}</Text>
              {safeAwayLine.innings.map((v, idx) => (
                <Text key={`a-${idx}`} style={styles.scoreCell}>
                  {v}
                </Text>
              ))}
              <Text style={styles.scoreCellBold}>{safeAwayLine.r}</Text>
              <Text style={styles.scoreCellBold}>{safeAwayLine.h}</Text>
              <Text style={styles.scoreCellBold}>{safeAwayLine.e}</Text>
            </View>

            <View style={[styles.scoreRow, homeWin && styles.scoreRowWinner]}>
              <Text style={styles.teamCodeCellText}>{safeHomeLine.team}</Text>
              {safeHomeLine.innings.map((v, idx) => (
                <Text key={`b-${idx}`} style={styles.scoreCell}>
                  {v}
                </Text>
              ))}
              <Text style={styles.scoreCellBold}>{safeHomeLine.r}</Text>
              <Text style={styles.scoreCellBold}>{safeHomeLine.h}</Text>
              <Text style={styles.scoreCellBold}>{safeHomeLine.e}</Text>
            </View>
          </View>
        </>
      )}

      {(footerLeft || footerRight || footerVenue) && !isScheduled && (
        <View style={styles.footerRow}>
          <View style={styles.footerLeftWrap}>
            {!!footerVenue && <Text style={styles.footerLeft} numberOfLines={1}>{footerVenue}</Text>}
          </View>
          <View style={styles.footerRightWrap}>
            {!!liveDetail && <Text style={styles.footerRight}>{liveDetail}</Text>}
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#071226',
    borderRadius: 22,
    borderWidth: 1,
    borderColor: '#20304a',
    paddingTop: 10,
    paddingHorizontal: 10,
    paddingBottom: 8,
    marginBottom: 12,
    shadowColor: '#000000',
    shadowOpacity: 0.2,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 6 },
    elevation: 4,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sideTeam: {
    width: 62,
    minHeight: 42,
    justifyContent: 'center',
  },
  sideTeamRight: {
    alignItems: 'flex-end',
  },
  teamName: {
    color: '#ffffff',
    fontSize: 9,
    fontWeight: '600',
    marginBottom: 2,
    lineHeight: 11,
  },
  winnerText: {
    color: '#f8fafc',
    fontWeight: '900',
  },
  teamRecord: {
    color: '#8ea0bb',
    fontSize: 8,
    fontWeight: '500',
    lineHeight: 10,
  },
  teamRecordRight: {
    textAlign: 'right',
  },
  teamLogo: {
    width: 38,
    height: 40,
    marginHorizontal: 12,
  },
  teamLogoFallback: {
    width: 38,
    height: 40,
    marginHorizontal: 12,
    borderRadius: 12,
    backgroundColor: '#0f1a2e',
    borderWidth: 1,
    borderColor: '#22314b',
    alignItems: 'center',
    justifyContent: 'center',
  },
  teamLogoFallbackText: {
    color: '#d7e0ee',
    fontSize: 9,
    fontWeight: '700',
  },
  centerWrap: {
    flex: 1,
    alignItems: 'center',
    minWidth: 99,
    paddingTop: 1,
  },
  scoreLine: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  bigScore: {
    color: '#ffffff',
    fontSize: 28,
    fontWeight: '800',
    width: 48,
    textAlign: 'center',
    letterSpacing: -0.8,
  },
  winnerScore: {
    color: '#facc15',
  },
  liveDot: {
    width: 7,
    height: 7,
    borderRadius: 999,
    backgroundColor: '#ef4444',
  },
  statusPillWrap: {
    width: 48,
    alignItems: 'center',
  },
  statusPill: {
    minWidth: 38,
    height: 18,
    borderRadius: 999,
    paddingHorizontal: 6,
    backgroundColor: '#1e293b',
    borderWidth: 1,
    borderColor: '#334155',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusPillLive: {
    minWidth: 42,
    paddingHorizontal: 6,
    backgroundColor: '#3b1016',
    borderColor: '#ef4444',
    shadowColor: '#ef4444',
    shadowOpacity: 0.55,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 0 },
    elevation: 3,
    gap: 4,
  },
  statusPillFinal: {
    backgroundColor: '#172033',
    borderColor: '#475569',
  },
  statusText: {
    color: '#ffffff',
    fontSize: 7,
    fontWeight: '800',
    letterSpacing: 0.6,
    textAlign: 'center',
  },
  statusTextLive: {
    color: '#ffffff',
    fontSize: 7,
    fontWeight: '900',
    letterSpacing: 0.4,
    textAlign: 'center',
  },
  scheduledWrap: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  scheduledPill: {
    paddingHorizontal: 8,
    height: 18,
    borderRadius: 999,
    backgroundColor: '#172033',
    borderWidth: 1,
    borderColor: '#334155',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 3,
  },
  scheduledLabel: {
    color: '#dbeafe',
    fontSize: 7,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  scheduledTime: {
    color: '#ffffff',
    fontSize: 20,
    fontWeight: '800',
    textAlign: 'center',
    letterSpacing: -0.4,
  },
  divider: {
    height: 1,
    backgroundColor: '#1f2d45',
    marginTop: 8,
    marginBottom: 5,
  },
  statusMetaRow: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 5,
  },
  statusMetaText: {
    color: '#dbeafe',
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.2,
  },
  lineTable: {
    backgroundColor: '#08172a',
    borderRadius: 14,
    paddingVertical: 5,
    paddingHorizontal: 4,
    borderWidth: 1,
    borderColor: '#12233a',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 2,
  },
  inningHeader: {
    width: 28,
    textAlign: 'center',
    color: '#8091aa',
    fontSize: 10,
    fontWeight: '800',
  },
  teamCodeCell: {
    width: 50,
  },
  scoreRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 1,
    borderRadius: 8,
    backgroundColor: 'rgba(255,255,255,0.025)',
  },
  scoreRowWinner: {
    backgroundColor: 'rgba(250,204,21,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(250,204,21,0.22)',
  },
  teamCodeCellText: {
    width: 50,
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '900',
  },
  scoreCell: {
    width: 28.5,
    textAlign: 'center',
    color: '#e8eef8',
    fontSize: 11,
    fontWeight: '500',
  },
  scoreCellBold: {
    width: 25,
    textAlign: 'center',
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '900',
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 7,
    paddingTop: 6,
    borderTopWidth: 1,
    borderTopColor: '#16243a',
  },
  footerLeftWrap: {
    flex: 1,
    paddingRight: 8,
  },
  footerRightWrap: {
    justifyContent: 'center',
    alignItems: 'flex-end',
  },
  footerLeft: {
    color: '#8ea0bb',
    fontSize: 9,
    fontWeight: '500',
    lineHeight: 11,
  },
  footerRight: {
    color: '#dbeafe',
    fontSize: 9,
    fontWeight: '700',
    textAlign: 'right',
  },
});
