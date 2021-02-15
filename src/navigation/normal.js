import {createStackNavigator} from 'react-navigation-stack';
import audioRoom from '../screens/audioRoom';
import profile from '../screens/profile';
import audioRoomHome from '../screens/audioRoomHome';
import scheduleRoom from '../screens/scheduleRoom';
const normalNavigator = createStackNavigator(
  {
    openingScreen: {
      screen: audioRoomHome,
    },
    audioRoom: {
      screen: audioRoom,
    },
    scheduleRoom: {
      screen: scheduleRoom,
    },
    profile: {
      screen: profile,
    },
    
  },
  {
    headerMode: 'none',
  },
);

export default normalNavigator;
