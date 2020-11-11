import React, { Component } from 'react';
import {
  Text,
  View,
  TouchableOpacity,
  Animated,
  Image,
  Modal,
  ActivityIndicator,
  FlatList,
  SafeAreaView,
  BackHandler,
  Dimensions
} from 'react-native';
import Box from './neumorphButton';
import CBox from './customizableNeuButton';
import Icon from 'react-native-vector-icons/Feather';
import FontAwesome from 'react-native-vector-icons/FontAwesome';
import LinearGradient from 'react-native-linear-gradient';
import Swiper from 'react-native-swiper';
import { connect } from 'react-redux'
import { REMOVE_ROOM_QUEUE, ADD_ROOM_AUDIENCE, REMOVE_ROOM_AUDIENCE, REMOVE_ROOM_HOSTS, ADD_ROOM_QUEUE, ADD_ROOM_HOSTS, TALK_ROOM_HOSTS, CLEAR_ROOM, CONNECTED_AUDIENCE, CONNECTED_HOSTS, CONNECTED_QUEUE, UPDATE_HOSTS } from '../redux/roomsRedux'
import RtcEngine from 'react-native-agora'
import ErrorPopup from './errorPopup'
import database from '@react-native-firebase/database'
import Toast from 'react-native-simple-toast'
const screenWidth = Math.round(Dimensions.get('window').width);
const roomQueue = [
  {
    photoUrl: 'https://source.unsplash.com/random',
    username: 'hasir',
    index: 1,

  }
]
const roomHosts = [
  {
    photoUrl: 'https://source.unsplash.com/random',
    username: 'hasir',
    connected: true,
    value: -1
  },
  {
    photoUrl: 'https://source.unsplash.com/random',
    username: 'steve',
    connected: true,
    // value: -1
  },
  {
    photoUrl: 'https://source.unsplash.com/random',
    username: 'jurgen',
    connected: true,
    // value: -1
  },
  {
    photoUrl: 'https://source.unsplash.com/random',
    username: 'steve',
    connected: true,
    // value: -1
  },
  {
    photoUrl: 'https://source.unsplash.com/random',
    username: 'jurgen',
    connected: true,
    // value: -1
  },  {
    photoUrl: 'https://source.unsplash.com/random',
    username: 'steve',
    connected: true,
    // value: -1
  },
  {
    photoUrl: 'https://source.unsplash.com/random',
    username: 'jurgen',
    connected: true,
    // value: -1
  },  {
    photoUrl: 'https://source.unsplash.com/random',
    username: 'steve',
    connected: true,
    // value: -1
  },
  {
    photoUrl: 'https://source.unsplash.com/random',
    username: 'jurgen',
    connected: true,
    // value: -1
  },  {
    photoUrl: 'https://source.unsplash.com/random',
    username: 'steve',
    connected: true,
    // value: -1
  },
  {
    photoUrl: 'https://source.unsplash.com/random',
    username: 'jurgen',
    connected: true,
    // value: -1
  },
  {
    photoUrl: 'https://source.unsplash.com/random',
    username: 'steve',
    connected: true,
    // value: -1
  },
  {
    photoUrl: 'https://source.unsplash.com/random',
    username: 'jurgen',
    connected: true,
    // value: -1
  },  {
    photoUrl: 'https://source.unsplash.com/random',
    username: 'steve',
    connected: true,
    // value: -1
  },
  {
    photoUrl: 'https://source.unsplash.com/random',
    username: 'jurgen',
    connected: true,
    // value: -1
  },
]
var naviagtionBarHidden = true;
class audioRoom extends Component {
  constructor(props) {
    super(props);
    this.state = {
      givePermissionPopUp: false,
      removePermissionPopUp: false,
      bounceValue: new Animated.Value(-300),
      textn: 'its working now',
      selectedUser: '',
      inQueue: false,
      initialConnection: false,
      createRoomModalVisible: false,
      reconnectingAttemptsLeft: 9,
      mic: true,
      role: this.props.navigation.getParam('role'),
      joinError: false,
      rejoinError: false,
      modalVisible: false,
      leave: false,
      loading: false,
    };
    this.BackHandler
    this.agoraUid
    this.agora
    // console.log(this.props.roomQueue+"hello");
  }
  _toggleNotification(values) {
    var toValue = -300;
    if (naviagtionBarHidden) {
      toValue = 0;
    }
    Animated.spring(values, {
      toValue: toValue,
      velocity: 10,
      tension: 2,
      friction: 8,
      useNativeDriver: true,
    }).start();
    naviagtionBarHidden = !naviagtionBarHidden;
  }
  // This function toggles the notification bar, and removes it after 5 seconds.
  timerToTheNotification = async values => {
    this._toggleNotification(values);
    await setTimeout(() => {
      this._toggleNotification(values);
    }, 2500);
  };
  // These two toggle the permissions popups, pass the current state of the popups.
  givePermissionPopUp(visible) {
    this.setState({ givePermissionPopUp: visible });
  }
  removePermissionPopUp(visible) {
    this.setState({ removePermissionPopUp: visible });
  }

  toggleCreateRoomModal = () => {
    this.setState({
      createRoomModalVisible: !this.state.createRoomModalVisible,
    });
  };

  // componentDidMount() {

  //   database().ref(`audience/${item['id']}/${this.props.user.user.username}`).set({
  //     value: new Date().getTime(),
  //     photoUrl: this.props.user.user.photoUrl
  //   })

  //   database().ref(`hosts/${this.props.navigation.getParam('roomId')}`).orderByChild('value').on('child_added', snap => {

  //     if(snap.key === this.props.user.user.username) {
  //       if(snap.val().value === -1) {
  //         this.setState({role: 3})
  //       }
  //       else {
  //         this.setState({role: 2})
  //       }
  //     }

  //     this.props.dispatch({
  //       type: ADD_ROOM_HOSTS,
  //       payload: {
  //         username: snap.key,
  //         value: snap.val().value,
  //         photoUrl: snap.val().photoUrl
  //       }
  //     })
  //   })

  //   database().ref(`hosts/${this.props.navigation.getParam('roomId')}`).orderByChild('value').on('child_changed', snap => {

  //     if(snap.key === this.props.user.user.username) {
  //       if(snap.val().value === -1) {
  //         this.setState({role: 3})
  //       }
  //       else {
  //         this.setState({role: 2})
  //       }
  //     }

  //     this.props.dispatch({
  //       type: UPDATE_HOSTS,
  //       payload: {
  //         username: snap.key,
  //         value: snap.val().value
  //       }
  //     })
  //   })

  //   database().ref(`hosts/${this.props.navigation.getParam('roomId')}`).orderByChild('value').on('child_removed', snap => {

  //     if(snap.key === this.props.user.user.username) {
  //       this.setState({role: 0})
  //     }

  //     this.props.dispatch({
  //       type: REMOVE_ROOM_HOSTS,
  //       payload: snap.key
  //     })
  //   })

  //   //// AUDIENCE NOW ////

  //   database().ref(`audience/${this.props.navigation.getParam('roomId')}`).orderByChild('value').on('child_added', snap => {
  //     this.props.dispatch({
  //       type: ADD_ROOM_AUDIENCE,
  //       payload: {
  //         username: snap.key,
  //         photoUrl: snap.val().photoUrl
  //       }
  //     })
  //   })

  //   database().ref(`audience/${this.props.navigation.getParam('roomId')}`).orderByChild('value').on('child_removed', snap => {
  //     this.props.dispatch({
  //       type: REMOVE_ROOM_AUDIENCE,
  //       payload: snap.key
  //     })
  //   })

  //   //// QUEUE NOW ////

  //   database().ref(`q/${this.props.navigation.getParam('roomId')}`).orderByChild('value').on('child_added', snap => {

  //     if(snap.key === this.props.user.user.username) {
  //       this.setState({role: 1})
  //     }

  //     this.props.dispatch({
  //       type: ADD_ROOM_QUEUE,
  //       payload: {
  //         username: snap.key,
  //         photoUrl: snap.val().photoUrl
  //       }
  //     })
  //   })

  //   database().ref(`q/${this.props.navigation.getParam('roomId')}`).orderByChild('value').on('child_removed', snap => {
  //     console.log("USERNAME", snap.key)
  //     this.props.dispatch({
  //       type: REMOVE_ROOM_QUEUE,
  //       payload: snap.key
  //     })
  //   })

  // }

  componentDidUpdate(prevProps, prevState) {

    if(prevState.role !== this.state.role) {
      console.log(`PREV ROLE: ${prevState.role} & CURR ROLE: ${this.state.role}`)
    }

  }

  componentWillUnmount() {

    database().ref(`hosts/${this.props.navigation.getParam('roomId')}`).off()
    database().ref(`audience/${this.props.navigation.getParam('roomId')}`).off()
    database().ref(`queue/${this.props.navigation.getParam('roomId')}`).off()

  }

  render() {
    if (this.state.loading) {
      return (
        <View style={{ flex: 1, justifyContent: "center" }}>
          <ActivityIndicator size="large" color="#EA7A7F" />
        </View>
      )
    }
    else {
      return (
        <View
          style={{
            flex: 1,
            backgroundColor: 'rgba(234,235,243,1)',
          }}>
          <View
            style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              paddingTop: 5,
              alignItems: 'center',
              marginHorizontal: 15,
              backgroundColor: 'rgba(234,235,243,1)',
              zIndex: 5,
            }}>
            {/* Give this the name of the audioroomm */}
            <View
              style={{ flexDirection: 'row', width: '65%', alignItems: 'center' }}>
              <Text
                style={{
                  width: '90%',
                  height: 30,
                  overflow: 'hidden',
                  fontSize: 25,
                  color: '#4e7bb4',
                }}
                ellipsizeMode="tail"
                numberOfLines={1}
                onPress={() =>
                  // THIS LINE BELOW BRINGS THE NOTIFICATION TO THE SCREEN. AND AUTOMATICALLY REMOVES AFTER 5 SECONDS. ADD YOUR OWN CALLING LOGIC AND REMOVE THIS ON PRESS.
                  this.timerToTheNotification(this.state.bounceValue)
                }
              >
                {`#${this.props.navigation.getParam('hashtag')}`}
              </Text>
            </View>
            <Leave pressFunction={async () => {
              console.log("LEAVE")
            }} name="Leave" />
          </View>
          <Text style={{marginLeft: 15, marginTop: 5,color: '#7F7F7F'}}>Swipe right to view the participants.</Text>
          {this.state.role != 3 && <Text style={{marginLeft: 15, color: '#7F7F7F'}}>User with a star is the admin.</Text>}
          {this.state.role === 3 && <Text style={{marginLeft: 15, color: '#7F7F7F'}}>Long Press for options.</Text>}
          <View
            style={{
              borderBottomColor: '#BFBFBF',
              borderBottomWidth: 2,
              width: '100%',
              marginVertical: 10,
              opacity: 0.2,
            }}
          />
          {/* <Modal
            animationType="fade"
            transparent={true}
            visible={this.state.createRoomModalVisible}
            onRequestClose={() => {
              Alert.alert("Modal has been closed.");
            }}
          >
            <View
              style={{
                flex: 1,
                justifyContent: "center",
                alignItems: "center",
                backgroundColor: "rgba(0,0,0,0.2)",
              }}
            >
              <View
                style={{
                  height: 250,
                  width: "80%",
                  borderWidth: 3,
                  borderColor: "#e5e5e5",
                  backgroundColor: "rgba(234,235,243,1)",
                  borderRadius: 10,
                  justifyContent: 'center',
                  alignItems: 'center'
                }}
              >
                <Text
                  style={{
                    color: "#4e7bb4",
                    fontWeight: "bold",
                    fontSize: 20,
                  }}
                >
                  Attemps Left : {this.state.reconnectingAttemptsLeft}
                </Text>
                <ActivityIndicator size="large" color="#EA7A7F" />

              </View>
            </View>
          </Modal> */}
          {/* List of Hosts */}
          <Swiper
            showsButtons={false}
            loop={false}
            horizontal={true}
            showsPagination={false}>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 20, color: '#4e7bb4', marginLeft: 15 }}>
                Hosts
              </Text>
              {/* ScrollView of Hosts, one with the star is Admin */}
              {/* Add a flatlist with THREE COLUMNS. Check Flatlist documentation for that.  */}
              {/* ~~~~~~~~~~~~~~~~~~~~~~~~~~~~ HOSTS ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~ */}
              {/* {console.log(this.props.roomQueue + 'hello')} */}
              <SafeAreaView
                style={{ flex: 1 }}
                showsVerticalScrollIndicator={false}
                style={{ marginBottom: 160 }}
                >
                {/*Check props below. */}
                <FlatList
                  horizontal={false}
                  numColumns={3}
                  data={this.props.roomHosts}
                  // data={roomHosts}
                  showsVerticalScrollIndicator={false}
                  keyExtractor={item => item.username}
                  style={{paddingLeft: 15}}
                  renderItem={({ item, index }) => {
                    // console.log(`AGORA ID: ${item.agoraId} and USERNAME: ${this.props.user.user.username}`)
                    if (item.value === -1) {
                      return (
                        <Admin
                          profilePic={item.photoUrl}
                          username={item.username}
                          navigateToProfile={this.dummy}
                          micOn={false}
                        />
                      )
                    }
                    else {
                      return (
                        <Host
                          profilePic={item.photoUrl}
                          username={item.username}
                          navigateToProfile={this.dummy}
                          micOn={false}
                          connected={item.connected}
                          longPressOnHosts={() => {
                            if (this.state.role === 3) {
                              this.setState({ selectedUser: item.username })
                              this.removePermissionPopUp(!this.state.removePermissionPopUp);
                            }
                          }}
                        />
                      )
                    }
                  }}
                />
              </SafeAreaView>
            </View>

            <View style={{ flex: 1, backgroundColor: "rgba(234,235,243,1)" }}>
              <Text style={{ fontSize: 20, color: "#4e7bb4", marginLeft: 15 }}>
                Description
            </Text>
              <Text
                style={{
                  fontWeight: "bold",
                  color: "#A1AFC3",
                  marginLeft: 15,
                  marginBottom: 20,
                }}
              >
                {`${this.props.navigation.getParam('caption')}`}
              </Text>
              <Text style={{ fontSize: 20, color: "#4e7bb4", marginLeft: 15 }}>
                Participants
            </Text>
              {/* ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~NEW SLIDE : PARTICIPANTS~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~ */}
              <SafeAreaView
                style={{ flex: 1 }}
                showsVerticalScrollIndicator={false}
                style={{ marginBottom: 150 }}>
                {/*Check props below. */}

                <FlatList
                  horizontal={false}
                  numColumns={3}
                  data={this.props.roomAudience}
                  // data={roomHosts}
                  style={{paddingLeft: 15, marginBottom: 100}}
                  keyExtractor={item => item.username}
                  renderItem={({ item }) => {
                    return (
                      <Participant
                        profilePic={item.photoUrl}
                        username={item.username}
                        navigateToProfile={this.dummy}
                        connected={item.connected}
                        longPressOnParticipant={() => {
                          if (this.state.role === 3) {
                            this.setState({ selectedUser: item.username })
                            this.givePermissionPopUp(!this.state.removePermissionPopUp);
                          }
                        }}
                      />
                    )
                  }}
                />
              </SafeAreaView>
            </View>
          </Swiper>
          {/* ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~ */}
          {/* Bottom TAB containing Leave, Talk and List of Users .This is absolutely positioned.*/}
          {/* ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~ */}
          <View
            style={{
              position: 'absolute',
              backgroundColor: 'rgba(234,235,243,1)',
              bottom: 0,
              paddingBottom: 10,
              paddingLeft: 15,
              borderTopColor: 'rgba(191,191,191,0.2)',
              borderTopWidth: 2,
              width: '100%',
              // flexDirection: 'row',
            }}>
            <View
              style={{
                flexDirection: "row",
                justifyContent: "space-evenly",
                marginBottom: 5,
              }}
            >
              {/*Write your Talk Function here.  */}

              {(this.state.role === 2 || this.state.role === 3) &&
                <MicButton
                  micOffFunction={() => {
                    console.log("OFF")
                  }}
                  micOnFunction={() => {
                    console.log("ON")
                  }}
                  micOnorNot={this.state.mic}
                />
              }

              {this.state.role === 0 &&
                <Talk pressFunction={() => {
                  if(this.props.connected) {
                    database().ref(`q/${this.props.navigation.getParam('roomId')}/${this.props.user.user.username}`).set({
                      value: new Date().getTime(),
                      photoUrl: this.props.user.user.photoUrl
                    })
                    .then(() => {
                      this.setState({role: 1})
                    })
                    .catch(() => {
                      Toast.show('We encountered an error. Please Try Again', Toast.SHORT)
                    })
                  }
                  else {
                    Toast.show('No Internet Connection', Toast.SHORT)
                  }
                }} name="Join Queue" />
              }

            </View>
            {/* Create a flatlist below to show participants. */}
            {/* ~~~~~~~~~~~~~~~~~~~~~~~QUEUE~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~  */}
            <FlatList
              data={this.props.roomQueue}
              // data={roomQueue}
              keyExtractor={item => item.username}
              horizontal={true}
              showsHorizontalScrollIndicator={false}
              renderItem={({ item, index }) => {
                // console.log("ITEM",item)
                return (
                  <PersonInQueue
                    navigateToProfile={this.dummy}
                    profilePic={item.photoUrl}
                    username={item.username}
                    queueNo={+index + 1}
                    longPressOnQueue={() => {
                      if (this.state.role === 3) {
                        this.setState({ selectedUser: item.username })
                        this.givePermissionPopUp(!this.state.givePermissionPopUp)
                      }
                    }}
                  />
                )
              }}
            />
          </View>
          <Notification
            bounceValue={this.state.bounceValue}
            message={this.state.textn}
          />
          {/* Notification which slides in and leaves automatically after 5 seconds. */}

          {/* ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~ GIVE PERMISSION POPUP ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~ */}
          <Modal
            animationType="fade"
            transparent={true}
            visible={this.state.givePermissionPopUp}
            onRequestClose={() => {
              this.givePermissionPopUp(!this.state.givePermissionPopUp);
            }}>
            <View
              style={{
                flex: 1,
                justifyContent: 'center',
                alignItems: 'center',
                backgroundColor: 'rgba(0,0,0,0.5)',
              }}>
              <View
                style={{
                  width: 300,
                  backgroundColor: '#fff',
                  borderRadius: 10,
                }}>
                <View
                  style={{
                    flexDirection: 'row',
                    justifyContent: 'space-between',
                    marginRight: 10,
                    marginLeft: 15,
                    marginTop: 10,
                  }}>
                  <Text
                    style={{ color: '#4e7bb4', fontSize: 20, fontWeight: 'bold' }}>
                    Options
                  </Text>
                  <TouchableOpacity
                    style={{
                      borderWidth: 2,
                      borderColor: '#cd5050',
                      height: 30,
                      width: 30,
                      borderRadius: 15,
                      alignItems: 'center',
                      justifyContent: 'center',
                      marginRight: 10,
                    }}
                    onPress={() => {
                      this.givePermissionPopUp(!this.state.givePermissionPopUp);
                    }}>
                    <FontAwesome name="close" size={15} color="#cd5050" />
                  </TouchableOpacity>
                </View>
                {/* Add on press here to make Admin */}
                <TouchableOpacity
                  onPress={async () => {
                    console.log("MAKE ADMIN")
                  }}
                  style={{
                    marginTop: 10,
                    borderTopColor: 'rgba(191,191,191,0.2)',
                    borderTopWidth: 2,
                    borderBottomColor: 'rgba(191,191,191,0.2)',
                    borderBottomWidth: 2,
                    paddingVertical: 10,
                  }}>
                  <Text style={{ color: '#7f7f7f', alignSelf: 'center' }}>
                    Make Admin
                  </Text>
                </TouchableOpacity>
                {/* Add on press here to give permission to talk. */}
                <TouchableOpacity style={{ paddingVertical: 10 }}
                  onPress={() => {
                    console.log("MAKE SPEAKER")
                  }}
                >
                  <Text style={{ color: '#7f7f7f', alignSelf: 'center' }}>
                    Give Permission to Talk
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </Modal>
          {/* ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~ REMOVE TALK PERMISSION POPUP ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~ */}
          <Modal
            animationType="fade"
            transparent={true}
            visible={this.state.removePermissionPopUp}
            onRequestClose={() => {
              this.removePermissionPopUp(!this.state.removePermissionPopUp);
            }}>
            <View
              style={{
                flex: 1,
                justifyContent: 'center',
                alignItems: 'center',
                backgroundColor: 'rgba(0,0,0,0.5)',
              }}>
              <View
                style={{
                  width: 300,
                  backgroundColor: '#fff',
                  borderRadius: 10,
                }}>
                <View
                  style={{
                    flexDirection: 'row',
                    justifyContent: 'space-between',
                    marginRight: 10,
                    marginLeft: 15,
                    marginTop: 10,
                  }}>
                  <Text
                    style={{ color: '#4e7bb4', fontSize: 20, fontWeight: 'bold' }}>
                    Options
                  </Text>
                  <TouchableOpacity
                    style={{
                      borderWidth: 2,
                      borderColor: '#cd5050',
                      height: 30,
                      width: 30,
                      borderRadius: 15,
                      alignItems: 'center',
                      justifyContent: 'center',
                      marginRight: 10,
                    }}
                    onPress={() => {
                      this.removePermissionPopUp(
                        !this.state.removePermissionPopUp,
                      );
                    }}>
                    <FontAwesome name="close" size={15} color="#cd5050" />
                  </TouchableOpacity>
                </View>
                {/* Add on press here to make admin. */}
                <TouchableOpacity
                  style={{
                    marginTop: 10,
                    borderTopColor: 'rgba(191,191,191,0.2)',
                    borderTopWidth: 2,
                    borderBottomColor: 'rgba(191,191,191,0.2)',
                    borderBottomWidth: 2,
                    paddingVertical: 10,
                  }}
                  onPress={async () => {
                    console.log("MAKE ADMIN SPEAKER")
                  }}
                >
                  <Text style={{ color: '#7f7f7f', alignSelf: 'center' }}>
                    Make Admin
                  </Text>
                </TouchableOpacity>
                {/* Add on press here to remove talk permission. */}
                <TouchableOpacity style={{ paddingVertical: 10 }}
                  onPress={() => {
                    console.log("REMOVE SPEAKER")
                  }}
                >
                  <Text style={{ color: '#7f7f7f', alignSelf: 'center' }}>
                    Remove Permission to Talk
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </Modal>
        </View>
      );
    }

  }
}
// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~JUST USE PROPS DONT MEDDLE WITH BELOW CLASSES~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~//
// NOtification: The props:
// bounceValue: You dont have to change that.
// message: Set you message accordingly.
// 1. You have been given permission to Talk.
// 2. Your talk permission has been revoked. Try entering the queue again.
// 3. Admin changed to XYZ.
// 4. Room has ended.
export class Notification extends Component {
  constructor(props) {
    super(props);
    this.state = {
      bounceValue: this.props.bounceValue,
    };
  }
  render() {
    return (
      <Animated.View
        style={{
          position: 'absolute',
          top: 0,
          alignSelf: 'center',
          // elevation: 5,
          marginTop: 80,
          backgroundColor: '#4e7bb4',
          paddingVertical: 5,
          paddingHorizontal: 15,
          borderRadius: 20,
          maxWidth: 300,
          transform: [{ translateY: this.state.bounceValue }],
        }}>
        <Text style={{ color: '#fff', fontWeight: 'bold', textAlign: 'center' }}>
          {this.props.message}
        </Text>
      </Animated.View>
    );
  }
}
// Admin Host: The props:
// profilePic: use uri or require
// username: string
// micOn: boolean, if true host is speaking ,if false not speaking.
export class Admin extends Component {
  render() {
    return (
      <TouchableOpacity
        style={{ width: screenWidth/3 -50, marginRight:  (screenWidth - 3*(screenWidth/3 -50))/3}}
        onPress={this.props.navigateToProfile}>
        <Box height={screenWidth/3 -40} width={screenWidth/3 -40} borderRadius={15} styleChildren={{justifyContent: 'center'}}>
          <Image
            style={{
              height: screenWidth/3 -40,
              width: screenWidth/3 -40,
              alignSelf:'center',
              borderColor: '#EA688A',
              borderWidth: 4,
              borderRadius: 15
            }}
            source={{ uri: this.props.profilePic }}
          />
        </Box>
        <Text
          style={{
            marginTop: -10,
            color: '#EA688A',
            overflow: 'hidden',
            width: 80,
            height: 20,
            fontSize: 12,
            textAlign: 'center',
            paddingHorizontal: 5,
            fontWeight: 'bold',
          }}>
          {this.props.username}
        </Text>
        <Icon
          name="star"
          size={15}
          style={{
            position: 'absolute',
            top: 5,
            right: -15,
            color: '#fff',
            backgroundColor: '#EA688A',
            padding: 3,
            borderRadius: 10,
          }}
        />
      </TouchableOpacity>
    );
  }
}
// Host : The props:
// profilePic: use uri or require
// username: string
// micOn: boolean, same as the above one
export class Host extends Component {
  render() {
    return (
      <TouchableOpacity
        style={{ width: screenWidth/3 -50, marginRight:  (screenWidth - 3*(screenWidth/3 -50))/3 }}
        onPress={this.props.navigateToProfile}
        onLongPress={this.props.longPressOnHosts}
      >
        <Box height={screenWidth/3 -40} width={screenWidth/3 -40} borderRadius={15}>
          <Image
            style={{
              height: screenWidth/3 -37,
              width: screenWidth/3 -37,
              borderColor: "#EA688A",
              borderWidth: this.props.micOn ? 3 : 0,
              borderRadius: 15,
              alignSelf: "center",
            }}
            source={{ uri: this.props.profilePic }}
          />

        </Box>
        <Text
          style={{
            marginTop: -10,
            color: "#A1AFC3",
            overflow: "hidden",
            width: 80,
            height: 20,
            fontSize: 12,
            textAlign: "center",
            paddingHorizontal: 5,
            fontWeight: "bold",
          }}
        >
          {this.props.username}
        </Text>
      </TouchableOpacity>
    );
  }
}
//Participant: The props are:
// navigateToProfile: function , on press navigate to profile.
// profilePic: use uri or require
// userTalking: boolean, if true username colors to pink ,else grey.
// username: string
// id: number, queue number.
export class PersonInQueue extends Component {
  render() {
    return (
      <View>
        <View style={this.props.style}>
          <View style={{ marginLeft: 3 }}>
            <TouchableOpacity
              onPress={this.props.navigateToProfile}
              onLongPress={this.props.longPressOnQueue}
            >
              <CBox
                height={50}
                width={50}
                borderRadius={10}
                borderBlack={8}
                radiusBlack={10}
                xBlack={10}
                yBlack={15}
                borderWhite={10}
                radiusWhite={10}
                xWhite={-1}
                yWhite={-1}
                style={{ marginLeft: 4 }}
              >
                <Image
                  style={{
                    height: 50,
                    width: 50,
                  }}
                  source={{ uri: this.props.profilePic }}
                />
              </CBox>
            </TouchableOpacity>
            <Text
              style={{
                color: "#A1AFC3",
                overflow: "hidden",
                width: 60,
                height: 15,
                fontSize: 10,
                textAlign: "center",
                paddingHorizontal: 5,
                fontWeight: "bold",
              }}
            >
              {this.props.username}
            </Text>
          </View>
        </View>
        <Text
          style={{
            position: "absolute",
            top: 3,
            right: 5,
            // marginTop: 3,
            color: "#fff",
            fontSize: 10,
            paddingHorizontal: 3,
            borderRadius: 10,
            overflow: "hidden",
            backgroundColor: "#4e7bb4",
          }}
        >
          {this.props.queueNo}
        </Text>
      </View>
    );
  }
}
// Just onPressFunction required to Talk.
export class Talk extends Component {
  render() {
    return (
      <Box height={40} width={225} borderRadius={20}>
        <TouchableOpacity onPress={this.props.pressFunction}>
          <LinearGradient
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            colors={['#EA688A', '#EA7A7F']}
            style={{
              height: 40,
              borderRadius: 20,
              width: 225,
              borderWidth: 1,
              borderColor: '#e5e5e5',
              alignSelf: 'center',
            }}>
            <Text
              style={{
                marginTop: 3,
                alignSelf: 'center',
                fontWeight: 'bold',
                color: '#fff',
                fontSize: 20,
              }}>
              {this.props.name}
            </Text>
          </LinearGradient>
        </TouchableOpacity>
      </Box>
    );
  }
}
// Just onPressFunction required to leave
export class Leave extends Component {
  render() {
    return (
      <Box height={35} width={100} borderRadius={17.5}>
        <TouchableOpacity onPress={this.props.pressFunction}>
          <Text
            style={{
              marginTop: 5,
              fontSize: 15,
              alignSelf: "center",
              fontWeight: "bold",
              color: "#EA688A",
            }}
          >
            {this.props.name}
          </Text>
          {/* </View> */}
        </TouchableOpacity>
      </Box>
    );
  }
}
// Subscribe Button:
// unSubscribedFunction: function, runs when user unsubscribes.
// subscribedFunction: function, runs when user subscribes.
export class Subscribe extends Component {
  constructor(props) {
    super(props);
    this.state = {
      subscribed: false,
    };
  }
  toggle = () => {
    if (this.state.subscribed) {
      this.setState({ subscribed: false });
      this.props.unSubscribedFunction();
    } else {
      this.setState({ subscribed: true });
      this.props.subscribedFunction();
    }
  };
  render() {
    return (
      <View>
        <TouchableOpacity onPress={this.toggle}>
          {this.state.subscribed ? (
            <Box height={40} width={40} borderRadius={10}>
              <FontAwesome
                name="heart"
                color="#EA688A"
                size={25}
                style={{ alignSelf: 'center', marginTop: 7 }}
              />
            </Box>
          ) : (
              <Box height={40} width={40} borderRadius={10}>
                <FontAwesome
                  name="heart-o"
                  color="#7f7f7f"
                  size={25}
                  style={{ alignSelf: 'center', marginTop: 7 }}
                />
              </Box>
            )}
        </TouchableOpacity>
      </View>
    );
  }
}
// Notify Button:
// unNotifyFunction: function, runs when user unnotifies
// notifyFunction: function, runs when user presses the bell icon to notify.
export class Notify extends Component {
  constructor(props) {
    super(props);
    this.state = {
      notify: false,
    };
  }
  toggle = () => {
    if (this.state.notify) {
      this.setState({ notify: false });
      this.props.unNotifyFunction;
    } else {
      this.setState({ notify: true });
      this.props.notifyFunction;
    }
  };
  render() {
    return (
      <View>
        <TouchableOpacity onPress={this.toggle}>
          {this.state.notify ? (
            <Box height={40} width={40} borderRadius={10}>
              <Icon
                name="bell"
                color="#7f7f7f"
                size={25}
                style={{ alignSelf: 'center', marginTop: 7 }}
              />
            </Box>
          ) : (
              <Box height={40} width={40} borderRadius={10}>
                <Icon
                  name="bell-off"
                  color="#7f7f7f"
                  size={25}
                  style={{ alignSelf: 'center', marginTop: 7 }}
                />
              </Box>
            )}
        </TouchableOpacity>
      </View>
    );
  }
}

export class MicButton extends Component {
  constructor(props) {
    super(props);
    this.state = {
      micON: this.props.micOnorNot,
    };
  }
  toggle = () => {
    if (this.state.micON) {
      this.setState({ micON: false });
      this.props.micOffFunction();
    } else {
      this.setState({ micON: true });
      this.props.micOnFunction();
    }
  };
  render() {
    return (
      <View>
        <TouchableOpacity onPress={this.toggle}>
          {this.state.micON ? (
            <Box height={40} width={40} borderRadius={10}>
              <Icon
                name="mic"
                color="#7f7f7f"
                size={25}
                style={{ alignSelf: "center", marginTop: 7 }}
              />
            </Box>
          ) : (
              <Box height={40} width={40} borderRadius={10}>
                <Icon
                  name="mic-off"
                  color="#7f7f7f"
                  size={25}
                  style={{ alignSelf: "center", marginTop: 7 }}
                />
              </Box>
            )}
        </TouchableOpacity>
      </View>
    );
  }
}

export class Participant extends Component {
  render() {
    return (
      <TouchableOpacity
        style={{ width: screenWidth/3 -50, marginRight: (screenWidth - 3*(screenWidth/3 -50))/3 }}
        onPress={this.props.navigateToProfile}
        onLongPress={this.props.longPressOnParticipant}>
        <Box height={screenWidth/3 -40} width={screenWidth/3 -40} borderRadius={15}>
          <Image
            style={{
              height: screenWidth/3 -40,
              width: screenWidth/3 -40,
            }}
            source={{ uri: this.props.profilePic }}
          />
        </Box>
        <Text
          style={{
            marginTop: -10,
            color: '#8f8f8f',
            overflow: 'hidden',
            width: 80,
            height: 20,
            fontSize: 12,
            textAlign: 'center',
            paddingHorizontal: 5,
            fontWeight: 'bold',
          }}>
          {this.props.username}
        </Text>
      </TouchableOpacity>
    );
  }
}

const mapStateToProps = (state) => {
  return (
    {
      roomHosts: state.rooms.roomHosts,
      roomQueue: state.rooms.roomQueue,
      roomAudience: state.rooms.roomAudience,
      role: state.rooms.role,
      user: state.user,
      connected: state.rooms.connected
    }
  )

}

export default connect(mapStateToProps)(audioRoom)
