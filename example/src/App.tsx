import {
  FinishMode,
  IWaveformRef,
  PermissionStatus,
  PlaybackSpeedType,
  PlayerState,
  RecorderState,
  UpdateFrequency,
  Waveform,
  useAudioPermission,
} from '@simform_solutions/react-native-audio-waveform';
import React, {
  Dispatch,
  SetStateAction,
  useEffect,
  useRef,
  useState,
} from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Linking,
  Pressable,
  ScrollView,
  StatusBar,
  Text,
  View,
} from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import {
  SafeAreaProvider,
  useSafeAreaInsets,
} from 'react-native-safe-area-context';
import { Icons } from './assets';
import {
  generateAudioList,
  playbackSpeedSequence,
  getRecordedAudios,
  type ListItem,
} from './constants';
import stylesheet from './styles';
import { Colors } from './theme';
import FastImage from 'react-native-fast-image';
import fs from 'react-native-fs';

const RenderListItem = React.memo(
  ({
    item,
    currentPlaying,
    setCurrentPlaying,
    onPanStateChange,
    currentPlaybackSpeed,
    changeSpeed,
  }: {
    item: ListItem;
    currentPlaying: string;
    setCurrentPlaying: Dispatch<SetStateAction<string>>;
    onPanStateChange: (value: boolean) => void;
    currentPlaybackSpeed: PlaybackSpeedType;
    changeSpeed: () => void;
  }) => {
    const ref = useRef<IWaveformRef>(null);
    const [playerState, setPlayerState] = useState(PlayerState.stopped);
    const styles = stylesheet({ currentUser: item.fromCurrentUser });
    const [isLoading, setIsLoading] = useState(true);

    const handleButtonAction = () => {
      if (playerState === PlayerState.stopped) {
        setCurrentPlaying(item.path);
      } else {
        setCurrentPlaying('');
      }
    };

    useEffect(() => {
      if (currentPlaying !== item.path) {
        ref.current?.stopPlayer();
      } else {
        ref.current?.startPlayer({ finishMode: FinishMode.stop });
      }
    }, [currentPlaying]);

    return (
      <View key={item.path} style={[styles.listItemContainer]}>
        <View style={styles.listItemWidth}>
          <View style={[styles.buttonContainer]}>
            <Pressable
              disabled={isLoading}
              onPress={handleButtonAction}
              style={styles.playBackControlPressable}>
              {isLoading ? (
                <ActivityIndicator color={'#FF0000'} />
              ) : (
                <FastImage
                  source={
                    playerState === PlayerState.stopped
                      ? Icons.play
                      : Icons.stop
                  }
                  style={styles.buttonImage}
                  resizeMode="contain"
                />
              )}
            </Pressable>
            <Waveform
              containerStyle={styles.staticWaveformView}
              mode="static"
              key={item.path}
              playbackSpeed={currentPlaybackSpeed}
              ref={ref}
              path={item.path}
              candleSpace={2}
              candleWidth={4}
              scrubColor={Colors.white}
              waveColor={Colors.lightWhite}
              candleHeightScale={4}
              onPlayerStateChange={state => {
                setPlayerState(state);
                if (
                  state === PlayerState.stopped &&
                  currentPlaying === item.path
                ) {
                  setCurrentPlaying('');
                }
              }}
              onPanStateChange={onPanStateChange}
              onError={error => {
                console.log(error, 'we are in example');
              }}
              onCurrentProgressChange={(currentProgress, songDuration) => {
                console.log(
                  'currentProgress ',
                  currentProgress,
                  'songDuration ',
                  songDuration
                );
              }}
              onChangeWaveformLoadState={state => {
                setIsLoading(state);
              }}
            />
            {playerState === PlayerState.playing ? (
              <Pressable
                onPress={changeSpeed}
                style={[styles.speedBox, styles.whiteBackground]}>
                <Text style={styles.speed}>{`${currentPlaybackSpeed}x`}</Text>
              </Pressable>
            ) : (
              <Image style={styles.speedBox} source={Icons.logo} />
            )}
          </View>
        </View>
      </View>
    );
  }
);

const LivePlayerComponent = ({
  setList,
}: {
  setList: Dispatch<SetStateAction<ListItem[]>>;
}) => {
  const ref = useRef<IWaveformRef>(null);
  const [recorderState, setRecorderState] = useState(RecorderState.stopped);
  const styles = stylesheet();
  const { checkHasAudioRecorderPermission, getAudioRecorderPermission } =
    useAudioPermission();

  const startRecording = () => {
    ref.current
      ?.startRecord({
        updateFrequency: UpdateFrequency.high,
      })
      .then(() => {})
      .catch(() => {});
  };

  const handleRecorderAction = async () => {
    if (recorderState === RecorderState.stopped) {
      let hasPermission = await checkHasAudioRecorderPermission();

      if (hasPermission === PermissionStatus.granted) {
        startRecording();
      } else if (hasPermission === PermissionStatus.undetermined) {
        const permissionStatus = await getAudioRecorderPermission();
        if (permissionStatus === PermissionStatus.granted) {
          startRecording();
        }
      } else {
        Linking.openSettings();
      }
    } else {
      ref.current?.stopRecord().then(path => {
        setList(prev => [...prev, { fromCurrentUser: true, path }]);
      });
    }
  };

  return (
    <View style={styles.liveWaveformContainer}>
      <Waveform
        mode="live"
        containerStyle={styles.liveWaveformView}
        ref={ref}
        candleSpace={2}
        candleWidth={4}
        waveColor={Colors.pink}
        onRecorderStateChange={setRecorderState}
      />
      <Pressable
        onPress={handleRecorderAction}
        style={styles.recordAudioPressable}>
        <Image
          source={
            recorderState === RecorderState.stopped ? Icons.mic : Icons.stop
          }
          style={styles.buttonImageLive}
          resizeMode="contain"
        />
      </Pressable>
    </View>
  );
};

const AppContainer = () => {
  const [shouldScroll, setShouldScroll] = useState<boolean>(true);
  const [currentPlaying, setCurrentPlaying] = useState<string>('');
  const [list, setList] = useState<ListItem[]>([]);
  const [nbOfRecording, setNumberOfRecording] = useState<number>(0);
  const [currentPlaybackSpeed, setCurrentPlaybackSpeed] =
    useState<PlaybackSpeedType>(1.0);

  const { top, bottom } = useSafeAreaInsets();
  const styles = stylesheet({ top, bottom });

  useEffect(() => {
    generateAudioList().then(audioListArray => {
      if (audioListArray?.length > 0) {
        setList(audioListArray);
      }
    });
  }, []);

  useEffect(() => {
    getRecordedAudios().then(recordedAudios =>
      setNumberOfRecording(recordedAudios.length)
    );
  }, [list]);

  const changeSpeed = () => {
    setCurrentPlaybackSpeed(
      prev =>
        playbackSpeedSequence[
          (playbackSpeedSequence.indexOf(prev) + 1) %
            playbackSpeedSequence.length
        ] ?? 1.0
    );
  };

  const handleDeleteRecordings = async () => {
    const recordings = await getRecordedAudios();

    const deleteRecordings = async () => {
      await Promise.all(recordings.map(async recording => fs.unlink(recording)))
        .then(() => {
          generateAudioList().then(audioListArray => {
            setList(audioListArray);
          });
        })
        .catch(error => {
          Alert.alert(
            'Error deleting recordings',
            'Below error happened while deleting recordings:\n' + error,
            [{ text: 'Dismiss' }]
          );
        });
    };

    Alert.alert(
      'Delete all recording',
      `Continue to delete all ${recordings.length} recordings.`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'OK', onPress: deleteRecordings },
      ]
    );
  };

  return (
    <View style={styles.appContainer}>
      <StatusBar
        barStyle={'dark-content'}
        backgroundColor={'transparent'}
        animated
        translucent
      />
      <GestureHandlerRootView style={styles.appContainer}>
        <View style={styles.screenBackground}>
          <View style={styles.container}>
            <View style={styles.headerContainer}>
              <Image
                source={Icons.simform}
                style={styles.simformImage}
                resizeMode="contain"
              />
              <Pressable
                style={[
                  styles.deleteRecordingContainer,
                  { opacity: nbOfRecording ? 1 : 0.5 },
                ]}
                onPress={handleDeleteRecordings}
                disabled={!nbOfRecording}>
                <Image
                  source={Icons.delete}
                  style={styles.buttonImage}
                  resizeMode="contain"
                />
                <Text style={styles.deleteRecordingTitle}>
                  {'Delete recorded audio files'}
                </Text>
              </Pressable>
            </View>
            <ScrollView scrollEnabled={shouldScroll}>
              {list.map(item => (
                <RenderListItem
                  key={item.path}
                  currentPlaying={currentPlaying}
                  setCurrentPlaying={setCurrentPlaying}
                  item={item}
                  onPanStateChange={value => setShouldScroll(!value)}
                  {...{ currentPlaybackSpeed, changeSpeed }}
                />
              ))}
            </ScrollView>
          </View>
          <LivePlayerComponent setList={setList} />
        </View>
      </GestureHandlerRootView>
    </View>
  );
};

export default function App() {
  return (
    <SafeAreaProvider>
      <AppContainer />
    </SafeAreaProvider>
  );
}
