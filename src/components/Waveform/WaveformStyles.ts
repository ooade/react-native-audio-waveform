import { StyleSheet } from 'react-native';
import { Colors } from '../../theme';

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  row: { flexDirection: 'row' },
  scrollContainer: {
    height: '100%',
  },
  waveformContainer: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.transparent,
    height: 60,
    paddingVertical: 2,
  },
  waveformInnerContainer: {
    position: 'relative',
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    width: '100%',
    height: '100%',
  },
  handle: {
    borderRadius: 15,
    position: 'absolute',
    marginLeft: -6,
    zIndex: 10,
  },
  touchableOpacity: {
    width: '100%',
    height: '100%',
    borderRadius: 15,
  },
});

export default styles;
