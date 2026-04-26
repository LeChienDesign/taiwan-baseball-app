import React from 'react';
import { View, Text, StyleSheet, Image } from 'react-native';

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
  status: 'FINAL' | 'LIVE' | 'SCHEDULED';
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
  const isScheduled = status === 'SCHEDULED';

  const awayInningsRaw = normalizeInnings(awayLine?.innings);
  const homeInningsRaw = normalizeInnings(homeLine?.innings);
  const inningHeaders = buildInningHeaders(innings, awayInningsRaw, homeInningsRaw);

  const awayInnings = padLine(awayInningsRaw, inningHeaders.length);
  const homeInnings = padLine(homeInningsRaw, inningHeaders.length);

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
          <Text style={styles.teamName}>{awayTeam.name}</Text>
          {!!awayTeam.record && <Text style={styles.teamRecord}>{awayTeam.record}</Text>}
        </View>

        <TeamLogo team={awayTeam} />

        <View style={styles.centerWrap}>
          {isScheduled ? (
            <>
              <View style={styles.scheduledWrap}>
                <Text style={styles.scheduledLabel}>SCHEDULED</Text>
                <Text style={styles.scheduledTime}>{footerRight || '--:--'}</Text>
              </View>
              <Text style={styles.venueText} numberOfLines={1}>
                {venue || '—'}
              </Text>
            </>
          ) : (
            <>
              <View style={styles.scoreLine}>
                <Text style={styles.bigScore}>{awayScore}</Text>

                {status === 'LIVE' ? (
                  <View style={styles.liveWrap}>
                    <View style={styles.liveDot} />
                    <Text style={styles.statusText}>{footerLeft || 'LIVE'}</Text>
                  </View>
                ) : status === 'FINAL' ? (
                  <Text style={styles.statusText}>FINAL</Text>
                ) : (
                  <Text style={styles.statusText}>SCH</Text>
                )}

                <Text style={styles.bigScore}>{homeScore}</Text>
              </View>

              <Text style={styles.venueText} numberOfLines={1}>
                {venue || '—'}
              </Text>
            </>
          )}
        </View>

        <TeamLogo team={homeTeam} />

        <View style={[styles.sideTeam, styles.sideTeamRight]}>
          <Text style={[styles.teamName, styles.teamNameRight]}>{homeTeam.name}</Text>
          {!!homeTeam.record && (
            <Text style={[styles.teamRecord, styles.teamRecordRight]}>{homeTeam.record}</Text>
          )}
        </View>
      </View>

      <View style={styles.divider} />

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

        <View style={styles.scoreRow}>
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

        <View style={styles.scoreRow}>
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

      {(footerLeft || footerRight) && !isScheduled && (
        <View style={styles.footerRow}>
          <View style={styles.footerLeftWrap}>
            {!!footerLeft && <Text style={styles.footerLeft}>{footerLeft}</Text>}
          </View>
          <View style={styles.footerRightWrap}>
            {!!footerRight && <Text style={styles.footerRight}>{footerRight}</Text>}
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#071226',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#1b2940',
    padding: 10,
    marginBottom: 12,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  sideTeam: {
    width: 60,
    minHeight: 38,
    justifyContent: 'flex-start',
  },
  sideTeamRight: {
    alignItems: 'flex-end',
  },
  teamName: {
    color: '#ffffff',
    fontSize: 8,
    fontWeight: '300',
    marginBottom: 2,
    lineHeight: 10,
  },
  teamNameRight: {
    textAlign: 'right',
  },
  teamRecord: {
    color: '#a8b3c7',
    fontSize: 9,
    fontWeight: '500',
    lineHeight: 10,
  },
  teamRecordRight: {
    textAlign: 'right',
  },
  teamLogo: {
    width: 35,
    height: 38,
    marginHorizontal: 15,
  },
  teamLogoFallback: {
    width: 35,
    height: 38,
    marginHorizontal: 15,
    borderRadius: 10,
    backgroundColor: '#0f1a2e',
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
    fontSize: 24,
    fontWeight: '600',
    width: 50,
    textAlign: 'center',
  },
  liveWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 4,
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 999,
    backgroundColor: '#ef4444',
    marginRight: 4,
  },
  statusText: {
    color: '#ffffff',
    fontSize: 8,
    fontWeight: '300',
    letterSpacing: 0.5,
    marginHorizontal: 0,
    textAlign: 'center',
  },
  scheduledWrap: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  scheduledLabel: {
    color: '#ffffff',
    fontSize: 8,
    fontWeight: '300',
    letterSpacing: 1,
    marginBottom: 2,
  },
  scheduledTime: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
  },
  venueText: {
    color: '#9aa7bf',
    fontSize: 8,
    marginTop: 2,
    textAlign: 'center',
  },
  divider: {
    height: 1,
    backgroundColor: '#1a2740',
    marginVertical: 2,
  },
  lineTable: {},
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 2,
  },
  inningHeader: {
    width: 28,
    textAlign: 'center',
    color: '#8f9bb0',
    fontSize: 11,
    fontWeight: '500',
  },
  teamCodeCell: {
    width: 50,
  },
  scoreRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 1,
  },
  teamCodeCellText: {
    width: 50,
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '700',
  },
  scoreCell: {
    width: 28.5,
    textAlign: 'center',
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '300',
  },
  scoreCellBold: {
    width: 25,
    textAlign: 'center',
    color: '#ffffff',
    fontSize: 10,
    fontWeight: '400',
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 3,
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
    color: '#d7e0ee',
    fontSize: 9,
    fontWeight: '200',
    lineHeight: 10,
  },
  footerRight: {
    color: '#d7e0ee',
    fontSize: 9,
    fontWeight: '300',
    textAlign: 'right',
  },
});