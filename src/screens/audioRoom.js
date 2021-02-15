import React, { Component } from 'react';
import {
  Text,
  View,
  TouchableOpacity,
  Animated,
  Image,
  Modal,
  FlatList,
  SafeAreaView,
  BackHandler,
  Dimensions,
  Platform,
  TextInput,
  ActivityIndicator
} from 'react-native';
import Box from './neumorphButton';
import CBox from './customizableNeuButton';
import Icon from 'react-native-vector-icons/Feather';
import FontAwesome from 'react-native-vector-icons/FontAwesome';
import LinearGradient from 'react-native-linear-gradient';
import Swiper from 'react-native-swiper';
import { connect } from 'react-redux';
import Share from 'react-native-share';
import {
  REMOVE_ROOM_QUEUE,
  ADD_ROOM_AUDIENCE,
  REMOVE_ROOM_AUDIENCE,
  REMOVE_ROOM_HOSTS,
  ADD_ROOM_QUEUE,
  ADD_ROOM_HOSTS,
  UPDATE_HOSTS,
  FLUSH_ROOM,
  ADD_AGORA_HOSTS,
  REMOVE_AGORA_HOSTS,
  AM_I_TALKING,
} from '../redux/roomsRedux';
import ErrorPopup from './errorPopup';
import database from '@react-native-firebase/database';
import Toast from 'react-native-simple-toast';
import RtcEngine from 'react-native-agora';
import firestore from '@react-native-firebase/firestore';
import RNFetchBlob from 'rn-fetch-blob';
import LottieView from 'lottie-react-native'
import ReactNativeForegroundService from "@supersami/rn-foreground-service";

const screenWidth = Math.round(Dimensions.get('window').width);
import dynamicLinks from '@react-native-firebase/dynamic-links';

var naviagtionBarHidden = true;
class audioRoom extends Component {
  constructor(props) {
    super(props);
    this.state = {
      givePermissionPopUp: false,
      removePermissionPopUp: false,
      reportPopup: false,
      bounceValue: new Animated.Value(-300),
      textn: 'its working now',
      selectedUser: '',
      selectedPhoto: '',
      agoraInitError: false,
      createRoomModalVisible: false,
      mic: true,
      role: this.props.navigation.getParam('role'),
      modalVisible: false,
      loading: true,
      roomEnded: false,
      talking: {},
      leave: false,
      feedbackModalVisible: false,
      feedback: '',
      shareLoading: false,
    };
    this.agora;
    this.numberOfHosts = 0;
  }
  deeplink = async (id) => {
    const link = await dynamicLinks().buildShortLink({
      link: 'https://keplr.org/' + id,
      // domainUriPrefix is created in your Firebase console
      domainUriPrefix: 'https://keplr.page.link',
      android: {
        packageName: 'com.keplr',
      },
      ios: {
        bundleId: 'com.keplrapp'
      }
    } , dynamicLinks.ShortLinkType.SHORT);
    // console.log(link);
    return link;

  }
  // ------------- SHARE ROOM FUNCTION @aryaman: Dated: Feb 8, 2020 -> Add Deep Link in message on line 97 -------------------------
  onShareFunction = async () => {
    let shareLink = await this.deeplink(this.props.navigation.getParam('roomId'));
    this.setState({ shareLoading: true })
    let file_url = "https://firebasestorage.googleapis.com/v0/b/keplr-4ff01.appspot.com/o/keplr-share.png?alt=media&token=3c6ed63b-d7ea-418e-a911-4899113033c8";

    let imagePath = null;
    RNFetchBlob.config({
      fileCache: true
    })
      .fetch("GET", file_url)
      // the image is now dowloaded to device's storage
      .then(resp => {
        // the image path you can use it directly with Image component
        imagePath = resp.path();
        return resp.readFile("base64");
      })
      .then(async base64Data => {
        var base64Data = `data:image/png;base64,` + base64Data;
        // here's base64 encoded image
        await Share.open({
          url: base64Data,

          message: "Join us on Keplr! \n" + shareLink

        });
        // remove the file from storage
        return fs.unlink(imagePath);
      }).catch(error => {
        this.setState({ shareLoading: false })
      });
    this.setState({ shareLoading: false })
    // ------------------------------------------------------
    // console.log("share share");
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
  timerToTheNotification = async (values) => {
    this._toggleNotification(values);
    setTimeout(() => {
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
  reportPopUp(visible) {
    this.setState({ reportPopUp: visible });
  }

  toggleCreateRoomModal = () => {
    this.setState({
      createRoomModalVisible: !this.state.createRoomModalVisible,
    });
  };

  backAction = () => {
    return true;
  };

  async componentDidMount() {
    if (Platform.OS === 'android') {
      BackHandler.addEventListener('hardwareBackPress', this.backAction);
      ReactNativeForegroundService.start({
        id: 144,
        title: "Please don\'t tap this notification",
        message: `🚀: ${this.props.navigation.getParam('hashtag')}`
      });
    }

    if (!this.props.connected) {
      Toast.show('You are disconnected from the Internet', Toast.LONG);
      this.props.navigation.navigate('openingScreen')
    } else {
      database()
        .ref(`e/${this.props.navigation.getParam('roomId')}`)
        .once('value', async (snap) => {
          if (snap.val() !== null) {
            this.setState({ loading: false });
            database().ref(`rooms/${this.props.navigation.getParam('roomId')}`).remove().catch()
            this.setState({ roomEnded: true });
          } else {
            database()
              .ref(
                `hosts/${this.props.navigation.getParam('roomId')}/${this.props.user.user.username
                }`,
              )
              .once('value', async (snap) => {
                var isHost = false;

                if (snap.val() !== null) {
                  isHost = true;
                }

                // console.log("ISHOST", isHost , snap.val())

                try {
                  this.agora = await RtcEngine.create(
                    'dd6a544633094bf48aa362dbace85303',
                  );
                  await this.agora.setChannelProfile(1);
                  await this.agora.disableVideo();
                  if (this.props.navigation.getParam('role') === 3) {
                    await this.agora.setClientRole(1);
                  } else {
                    await this.agora.setClientRole(2);
                  }
                  await this.agora.joinChannelWithUserAccount(
                    this.props.navigation.getParam('agoraToken'),
                    this.props.navigation.getParam('roomId'),
                    this.props.user.user.username,
                  );
                  await this.agora.setParameters('{"che.audio.opensl":true}');
                  await this.agora.enableAudioVolumeIndication(750, 3, true);

                  //// FIREBASE FROM HERE ////

                  if (this.state.role < 2 && !isHost) {
                    database()
                      .ref(
                        `audience/${this.props.navigation.getParam('roomId')}/${this.props.user.user.username
                        }`,
                      )
                      .set({
                        value: Math.floor(new Date().getTime() / 1000),
                        photoUrl: this.props.user.user.photoUrl,
                      });
                  }

                  if (this.state.role === 3) {
                    database()
                      .ref(`hosts/${this.props.navigation.getParam('roomId')}`)
                      .set({
                        [`${this.props.user.user.username}`]: {
                          value: -1,
                          photoUrl: this.props.user.user.photoUrl,
                        },
                      });
                  }

                  //// HOSTS CHANGES ////

                  database()
                    .ref(`hosts/${this.props.navigation.getParam('roomId')}`)
                    .orderByChild('value')
                    .on('child_added', (snap) => {
                      this.numberOfHosts += 1;

                      if (snap.key === this.props.user.user.username) {
                        if (snap.val().value === -1) {
                          this.setState({ role: 3 });
                        } else {
                          this.setState({ role: 2 });
                        }
                      }

                      this.props.dispatch({
                        type: ADD_ROOM_HOSTS,
                        payload: {
                          username: snap.key,
                          value: snap.val().value,
                          photoUrl: snap.val().photoUrl,
                        },
                      });
                    });

                  database()
                    .ref(`hosts/${this.props.navigation.getParam('roomId')}`)
                    .orderByChild('value')
                    .on('child_changed', (snap) => {
                      if (snap.key === this.props.user.user.username) {
                        if (snap.val().value === -1) {
                          this.setState({ role: 3 });
                        } else {
                          this.setState({ role: 2 });
                        }
                      }

                      this.props.dispatch({
                        type: UPDATE_HOSTS,
                        payload: {
                          username: snap.key,
                          value: snap.val().value,
                        },
                      });
                    });

                  database()
                    .ref(`hosts/${this.props.navigation.getParam('roomId')}`)
                    .orderByChild('value')
                    .on('child_removed', (snap) => {
                      this.numberOfHosts -= 1;

                      if (snap.key === this.props.user.user.username) {
                        this.setState({ role: 0 });
                      }

                      this.props.dispatch({
                        type: REMOVE_ROOM_HOSTS,
                        payload: snap.key,
                      });
                    });

                  //// AUDIENCE NOW ////

                  database()
                    .ref(`audience/${this.props.navigation.getParam('roomId')}`)
                    .orderByChild('value')
                    .on('child_added', (snap) => {
                      this.props.dispatch({
                        type: ADD_ROOM_AUDIENCE,
                        payload: {
                          username: snap.key,
                          photoUrl: snap.val().photoUrl,
                        },
                      });
                    });

                  database()
                    .ref(`audience/${this.props.navigation.getParam('roomId')}`)
                    .orderByChild('value')
                    .on('child_removed', (snap) => {
                      this.props.dispatch({
                        type: REMOVE_ROOM_AUDIENCE,
                        payload: snap.key,
                      });
                    });

                  //// QUEUE NOW ////

                  database()
                    .ref(`q/${this.props.navigation.getParam('roomId')}`)
                    .orderByChild('value')
                    .on('child_added', (snap) => {
                      if (snap.key === this.props.user.user.username) {
                        this.setState({ role: 1 });
                      }

                      this.props.dispatch({
                        type: ADD_ROOM_QUEUE,
                        payload: {
                          username: snap.key,
                          photoUrl: snap.val().photoUrl,
                        },
                      });
                    });

                  database()
                    .ref(`q/${this.props.navigation.getParam('roomId')}`)
                    .orderByChild('value')
                    .on('child_removed', (snap) => {
                      this.props.dispatch({
                        type: REMOVE_ROOM_QUEUE,
                        payload: snap.key,
                      });
                    });

                  database()
                    .ref(`e/${this.props.navigation.getParam('roomId')}`)
                    .on('value', (snap) => {
                      if (snap.val() !== null) {
                        if (snap.val() === 1) {
                          this.setState({ roomEnded: true });
                        }
                      }
                    });

                  // database().ref(`disconnected/${this.props.navigation.getParam('roomId')}/${this.props.user.user.username}`).onDisconnect().set(1)

                  //// AGORA LISTENERS HERE

                  this.agora.addListener('UserInfoUpdated', (uid, account) => {
                    this.props.dispatch({
                      type: ADD_AGORA_HOSTS,
                      payload: {
                        agoraId: uid,
                        username: account['userAccount'],
                      },
                    });
                  });

                  this.agora.addListener('UserOffline', (uid, reason) => {
                    this.props.dispatch({
                      type: REMOVE_AGORA_HOSTS,
                      payload: {
                        agoraId: uid,
                      },
                    });
                  });

                  this.agora.addListener(
                    'AudioVolumeIndication',
                    (speakers, totalVolume) => {
                      // console.log("SPEAKERS", speakers , speakers.length)

                      var current = {};

                      for (var i = 0; i < speakers.length; i += 1) {
                        if (i === 0) {
                          if (speakers[i].uid === 0) {
                            this.props.dispatch({
                              type: AM_I_TALKING,
                              payload: speakers[0].vad,
                            });
                          } else {
                            if (
                              this.props.agoraHosts[speakers[i].uid] !==
                              undefined
                            ) {
                              current[
                                this.props.agoraHosts[speakers[i].uid]
                              ] = 1;
                              // this.setState({ talking: { ...this.state.talking, [this.props.agoraHosts[speakers[i].uid]]: 1 } })
                            }
                          }
                        } else {
                          if (
                            this.props.agoraHosts[speakers[i].uid] !== undefined
                          ) {
                            current[this.props.agoraHosts[speakers[i].uid]] = 1;
                            // this.setState({ talking: { ...this.state.talking, [this.props.agoraHosts[speakers[i].uid]]: 1 } })
                          }
                        }

                        if (
                          this.props.agoraHosts[speakers[i].uid] !== undefined
                        ) {
                          current[this.props.agoraHosts[speakers[i].uid]] = 1;
                          // this.setState({ talking: { ...this.state.talking, [this.props.agoraHosts[speakers[i].uid]]: 1 } })
                        }
                      }

                      if (speakers.length > 0 && speakers[0].uid !== 0) {
                        this.setState({ talking: current });
                      } else {
                        this.setState({ talking: current });
                      }
                    },
                  );

                  this.setState({ loading: false });
                } catch (error) {
                  this.setState({ loading: false });
                  //console.log("INSIDE CATCH ERROR", error)
                  if (this.state.role === 3) {
                    database()
                      .ref(`rooms/${this.props.navigation.getParam('roomId')}`)
                      .remove();
                  }
                  this.setState({ agoraInitError: true });
                }
              });
          }
        });
    }
  }

  async componentDidUpdate(prevProps, prevState) {
    //// ROLE CHANGES ////

    if (prevState.role !== this.state.role) {
      /// MADE HOST OR ADMIN FROM QUEUE OR AUDIENCE

      if (
        (prevState.role === 1 || prevState.role === 0) &&
        (this.state.role === 2 || this.state.role === 3)
      ) {
        try {
          await this.agora.setClientRole(1);

          if (this.state.role === 2) {
            this.setState({ mic: true, textn: 'You have been made a Speaker!' });
          } else {
            this.setState({
              mic: true,
              textn: 'You have been made a Moderator!',
            });
          }

          this.timerToTheNotification(this.state.bounceValue);
        } catch (error) { }
      }

      /// REMOVED AS HOST OR ADMIN

      if (
        (prevState.role === 2 || prevState.role === 3) &&
        (this.state.role === 1 || this.state.role === 0)
      ) {
        try {
          await this.agora.setClientRole(2);

          if (prevState.role === 2) {
            this.setState({
              mic: false,
              textn: 'You have been removed as a Speaker!',
            });
          } else {
            this.setState({
              mic: false,
              textn: 'You have been removed as a Moderator!',
            });
          }
          this.timerToTheNotification(this.state.bounceValue);
        } catch (error) { }
      }
    }

    //// MIC CHANGES ////

    if (this.state.mic !== prevState.mic) {
      /// MIC ON NOW

      if (this.state.mic) {
        if (this.state.role === 2 || this.state.role === 3) {
          try {
            await this.agora.muteLocalAudioStream(false);
          } catch (error) { }
        }
      }

      /// MIC OFF NOW
      else {
        if (this.state.role === 2 || this.state.role === 3) {
          try {
            await this.agora.muteLocalAudioStream(true);
          } catch (error) { }
        }
      }
    }

    //// CONNECTION CHANGES ////

    if (this.props.connected !== prevProps.connected) {
      /// CONNECTED NOW

      if (this.props.connected) {
        this.setState({ textn: 'Re-connected Successfully' });

        try {
          await this.agora.muteAllRemoteAudioStreams(false);
        } catch (error) { }

        if (this.state.role === 2 || this.state.role === 3) {
          this.setState({ mic: false });
        }

        this.timerToTheNotification(this.state.bounceValue);
      }

      /// DISCONNECTED NOW
      else {
        this.setState({ textn: 'Disconnected from Internet' });

        try {
          await this.agora.muteAllRemoteAudioStreams(true);
        } catch (error) { }

        if (this.state.role === 2 || this.state.role === 3) {
          this.setState({ mic: false });
        }

        this.timerToTheNotification(this.state.bounceValue);
      }
    }
  }

  async componentWillUnmount() {
    database()
      .ref(`e/${this.props.navigation.getParam('roomId')}`)
      .off();

    if(Platform.OS === 'android') {
      ReactNativeForegroundService.stop()
    }

    // this.BackHandler.remove()

    // BackHandler.removeEventListener('hardwareBackPress', this.backAction);
    // try {
    //   await this.agora.leaveChannel();
    //   this.agora.removeAllListeners();

    //   await this.agora.destroy();
    // } catch (error) { }

    this.props.dispatch({
      type: FLUSH_ROOM,
    });

    // database()
    //   .ref(`hosts/${this.props.navigation.getParam('roomId')}`)
    //   .off();
    // database()
    //   .ref(`audience/${this.props.navigation.getParam('roomId')}`)
    //   .off();
    // database()
    //   .ref(`q/${this.props.navigation.getParam('roomId')}`)
    //   .off();
  }

  render() {
    if (this.state.loading) {
      return (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgb(233, 235, 244)' }}>
          {/* <ActivityIndicator size="large" color="#3a7bd5" /> */}
          <LottieView
            source={require('../../Assets/rocket.json')}
            autoPlay
            loop
            speed={1.5}
            style={{
              height: 200,
              // marginTop: '30%',
              alignSelf: 'center',
            }}
          />
          <Text style={{
            color: '#3a7bd5',
            fontSize: 20,
            fontWeight: 'bold', alignSelf: 'center'
          }}>
            Houston do you copy?
            </Text>
          {/* <PacmanIndicator color="#3a7bd5" size={50} /> */}
        </View>
      );
    } else {
      return (
        <SafeAreaView
          style={{
            flex: 1,
            backgroundColor: 'rgb(233, 235, 244)',
          }}>
          <View
            style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              paddingTop: 15,
              // alignItems: 'center',
              marginHorizontal: 15,
              backgroundColor: 'rgb(233, 235, 244)',
              zIndex: 5,
            }}>
            {/* Give this the name of the audioroomm */}
            <View
              style={{
                width: '70%',
              }}>
              <Text
                style={{
                  width: '90%',
                  // height: 30,
                  overflow: 'hidden',
                  // marginTop: 10,
                  fontSize: 25,
                  fontWeight: 'bold',
                  color: '#3a7bd5',
                }}
                ellipsizeMode="tail"
                numberOfLines={2}>
                {this.props.navigation.getParam('hashtag')}
              </Text>
              <Text style={{ fontWeight: 'bold', marginTop: 5, color: '#A1AFC3' }}>
                Swipe right to view the participants.
              </Text>
              <Text style={{ fontWeight: 'bold', color: '#A1AFC3' }}>
                Users with a star are moderators.
              </Text>
              {this.state.role === 3 && (
                <Text style={{ fontWeight: 'bold', color: '#A1AFC3' }}>
                  Long Press for options.
                </Text>
              )}
            </View>
            <View>
              <Leave
                pressFunction={async () => {
                  this.setState({ leave: true });

                  database()
                    .ref(`hosts/${this.props.navigation.getParam('roomId')}`)
                    .off();
                  database()
                    .ref(`audience/${this.props.navigation.getParam('roomId')}`)
                    .off();
                  database()
                    .ref(`q/${this.props.navigation.getParam('roomId')}`)
                    .off();

                  BackHandler.removeEventListener('hardwareBackPress', this.backAction);
                  try {
                    await this.agora.leaveChannel();
                    this.agora.removeAllListeners();

                    await this.agora.destroy();
                  } catch (error) { }

                  if (this.state.role === 2 || this.state.role === 3) {
                    database()
                      .ref(
                        `hosts/${this.props.navigation.getParam('roomId')}/${this.props.user.user.username
                        }`,
                      )
                      .remove()
                      .catch();
                    this.props.navigation.navigate('openingScreen');
                  } else if (this.state.role === 1) {
                    // database().ref(`queue/${this.props.navigation.getParam('roomId')}/${this.props.user.user.username}`).remove().catch()
                    database()
                      .ref(
                        `audience/${this.props.navigation.getParam('roomId')}/${this.props.user.user.username
                        }`,
                      )
                      .remove()
                      .catch();
                      this.props.navigation.navigate('openingScreen')
                  } else {
                    database()
                      .ref(
                        `audience/${this.props.navigation.getParam('roomId')}/${this.props.user.user.username
                        }`,
                      )
                      .remove()
                      .catch();
                      this.props.navigation.navigate('openingScreen')
                  }
                }}
                name="Leave"
              />
              <TouchableOpacity onPress={this.onShareFunction} style={{ flexDirection: "row", justifyContent: 'center', alignItems: 'center', marginTop: 15 }}>
                <FontAwesome name="share-square-o" size={25} color="#A1AFC3" style={{ marginRight: 5 }} />
                {this.state.shareLoading ? (
                  <ActivityIndicator size="small" color="#A1AFC3" />
                ) : (
                    <Text style={{ fontWeight: 'bold', color: "#A1AFC3", fontSize: 15 }}>Share</Text>
                  )}
              </TouchableOpacity>
            </View>
          </View>
          <View
            style={{
              borderBottomColor: '#BFBFBF',
              borderBottomWidth: 2,
              width: '100%',
              marginVertical: 10,
              opacity: 0.2,
            }}
          />

          <ErrorPopup
            title="Audio Initialisation Error"
            subTitle="There was an error while initialising audio. Please go to Home screen and try again."
            okButtonText="GO TO HOME"
            clickFunction={() => {
              this.setState({ agoraInitError: false });
              this.props.navigation.navigate('openingScreen')
            }}
            modalVisible={this.state.agoraInitError}
          />

          <FeedbackModal
            feedbackModalVisible={this.state.feedbackModalVisible}
            toggleCreateRoomModal={() =>
              this.setState({ feedbackModalVisible: false })
            }
            onChangeText={(text) => {
              this.setState({ feedback: text });
            }}

            submitFunction={() => {
              firestore().collection('report').doc(this.state.selectedUser).collection('report').doc(this.props.user.user.username).set({
                report: this.state.feedback
              }).catch()
              this.setState({
                feedbackModalVisible: false
              })
            }}
          />

          <ErrorPopup
            title="TownHall Ended"
            subTitle="The hall was ended because there were no speakers. Please refresh the home page."
            okButtonText="GO TO HOME"
            clickFunction={() => {
              this.setState({ roomEnded: false });
              this.props.navigation.navigate('openingScreen')
            }}
            modalVisible={this.state.roomEnded && !this.state.leave}

          />



          <Swiper
            showsButtons={false}
            loop={false}
            horizontal={true}
            showsPagination={false}>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 20, color: '#3a7bd5', marginLeft: 15 }}>
                Hosts
              </Text>
              {/* ScrollView of Hosts, one with the star is Admin */}
              {/* Add a flatlist with THREE COLUMNS. Check Flatlist documentation for that.  */}
              {/* ~~~~~~~~~~~~~~~~~~~~~~~~~~~~ HOSTS ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~ */}
              <SafeAreaView
                style={{ flex: 1 }}
                showsVerticalScrollIndicator={false}
                style={{
                  marginBottom: this.props.roomQueue.length > 0 ? 100 : 160,
                }}>
                {/*Check props below. */}
                <FlatList
                  horizontal={false}
                  extraData={this.state.talking}
                  showsVerticalScrollIndicator={false}
                  style={{
                    paddingTop: 10,
                    marginLeft: -25,
                  }}
                  numColumns={3}
                  data={this.props.roomHosts}
                  keyExtractor={(item) => item.username}
                  renderItem={({ item, index }) => {
                    var micOn = false;
                    if (item.username === this.props.user.user.username) {
                      if (this.props.AmItalking === 1) {
                        micOn = true;
                      }
                    } else {
                      if (this.state.talking[item.username] === 1) {
                        micOn = true;
                      }
                    }
                    // console.log(`AGORA ID: ${item.agoraId} and USERNAME: ${this.props.user.user.username}`)
                    if (item.value === -1) {
                      return (
                        <Admin
                          profilePic={item.photoUrl}
                          username={item.username}
                          navigateToProfile={this.dummy}
                          micOn={micOn}
                          onReport={() => {
                            this.setState({
                              selectedUser: item.username,
                            });
                            this.reportPopUp(!this.state.reportPopup);
                          }}
                        />
                      );
                    } else {
                      return (
                        <Host
                          profilePic={item.photoUrl}
                          username={item.username}
                          navigateToProfile={this.dummy}
                          micOn={micOn}
                          connected={item.connected}
                          longPressOnHosts={() => {
                            if (this.state.role === 3) {
                              if (item.value !== -1) {
                                this.setState({
                                  selectedUser: item.username,
                                  selectedPhoto: item.photoUrl,
                                });
                                this.removePermissionPopUp(
                                  !this.state.removePermissionPopUp,
                                );
                              }
                            } else {
                              if (item.value !== -1) {
                                this.setState({
                                  selectedUser: item.username,
                                  selectedPhoto: item.photoUrl,
                                });
                                this.reportPopUp(!this.state.reportPopup);
                              }
                            }
                          }}
                        />
                      );
                    }
                  }}
                />
              </SafeAreaView>
            </View>

            <View style={{ flex: 1, backgroundColor: 'rgb(233, 235, 244)' }}>
              <Text style={{ fontSize: 20, color: '#3a7bd5', marginLeft: 15 }}>
                Description
              </Text>
              <Text
                style={{
                  fontWeight: 'bold',
                  color: '#A1AFC3',
                  marginLeft: 15,
                  marginBottom: 20,
                }}>
                {`${this.props.navigation.getParam('caption')}`}
              </Text>
              <Text style={{ fontSize: 20, color: '#3a7bd5', marginLeft: 15 }}>
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
                  style={{ paddingLeft: -15, marginBottom: 100 }}
                  numColumns={3}
                  data={this.props.roomAudience}
                  keyExtractor={(item) => item.username}
                  renderItem={({ item }) => {
                    return (
                      <Participant
                        profilePic={item.photoUrl}
                        username={item.username}
                        navigateToProfile={this.dummy}
                        connected={item.connected}
                        longPressOnParticipant={() => {
                          if (this.state.role === 3) {
                            this.setState({
                              selectedUser: item.username,
                              selectedPhoto: item.photoUrl,
                            });
                            this.givePermissionPopUp(
                              !this.state.removePermissionPopUp,
                            );
                          } else {
                            this.setState({
                              selectedUser: item.username,
                              selectedPhoto: item.photoUrl,
                            });
                            this.reportPopUp(!this.state.reportPopup);
                          }
                        }}
                      />
                    );
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
              backgroundColor: 'rgb(233, 235, 244)',
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
                flexDirection: 'row',
                justifyContent: 'space-evenly',
                marginBottom: 5,
              }}>
              {/*Write your Talk Function here.  */}

              {(this.state.role === 2 || this.state.role === 3) && (
                <MicButton
                  micOffFunction={() => {
                    if (this.props.connected) {
                      this.setState({ mic: false });
                    } else {
                      Toast.show('No Internet Connection. Please re-connect');
                    }
                  }}
                  micOnFunction={() => {
                    if (this.props.connected) {
                      this.setState({ mic: true });
                    } else {
                      Toast.show('No Internet Connection. Please re-connect');
                    }
                  }}
                  micOnorNot={this.state.mic}
                />
              )}

              {/* //// JOIN QUEUE //// */}

              {this.state.role === 0 && (
                <Talk
                  pressFunction={() => {
                    if (this.props.connected) {
                      database()
                        .ref(
                          `q/${this.props.navigation.getParam('roomId')}/${this.props.user.user.username
                          }`,
                        )
                        .set({
                          value: Math.floor(new Date().getTime() / 1000),
                          photoUrl: this.props.user.user.photoUrl,
                        })
                        .then(() => {
                          this.setState({ role: 1 });
                        })
                        .catch(() => {
                          Toast.show(
                            'We encountered an error. Please Try Again',
                            Toast.SHORT,
                          );
                        });
                    } else {
                      Toast.show('No Internet Connection', Toast.SHORT);
                    }
                  }}
                  name="Join Queue"
                />
              )}
            </View>
            {/* Create a flatlist below to show participants. */}
            {/* ~~~~~~~~~~~~~~~~~~~~~~~QUEUE~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~  */}
            <FlatList
              data={this.props.roomQueue}
              keyExtractor={(item) => item.username}
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
                        this.setState({
                          selectedUser: item.username,
                          selectedPhoto: item.photoUrl,
                        });
                        this.givePermissionPopUp(
                          !this.state.givePermissionPopUp,
                        );
                      } else {
                        this.setState({
                          selectedUser: item.username,
                          selectedPhoto: item.photoUrl,
                        });
                        this.reportPopUp(!this.state.reportPopup);
                      }
                    }}
                  />
                );
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
                    style={{
                      color: '#3a7bd5',
                      fontSize: 20,
                      fontWeight: 'bold',
                    }}>
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
                    if (this.props.connected) {
                      if (this.numberOfHosts < 17) {
                        database()
                          .ref(
                            `hosts/${this.props.navigation.getParam(
                              'roomId',
                            )}/${this.state.selectedUser}`,
                          )
                          .set({
                            value: -1,
                            photoUrl: this.state.selectedPhoto,
                          })
                          .catch();
                      } else {
                        Toast.show(
                          "Apologies, but there can't be more than 17 speakers",
                        );
                      }
                    } else {
                      Toast.show('You are disconnected. Please re-connect');
                    }
                    this.givePermissionPopUp(!this.state.givePermissionPopUp);
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
                    Make Moderator
                  </Text>
                </TouchableOpacity>
                {/* Add on press here to give permission to talk. */}
                <TouchableOpacity
                  style={{ paddingVertical: 10 }}
                  onPress={() => {
                    if (this.props.connected) {
                      if (this.numberOfHosts < 17) {
                        database()
                          .ref(
                            `hosts/${this.props.navigation.getParam(
                              'roomId',
                            )}/${this.state.selectedUser}`,
                          )
                          .set({
                            value: Math.floor(new Date().getTime() / 1000),
                            photoUrl: this.state.selectedPhoto,
                          })
                          .catch();
                      } else {
                        Toast.show(
                          "Apologies, but there can't be more than 17 speakers",
                        );
                      }
                    } else {
                      Toast.show('You are disconnected. Please re-connect');
                    }
                    this.givePermissionPopUp(!this.state.givePermissionPopUp);
                  }}>
                  <Text style={{ color: '#7f7f7f', alignSelf: 'center' }}>
                    Give Permission to Talk
                  </Text>
                </TouchableOpacity>

                {/* Report*/}

                <TouchableOpacity
                  style={{ paddingVertical: 10 }}
                  onPress={() => {
                    this.givePermissionPopUp(!this.state.givePermissionPopUp);
                    this.setState({
                      feedbackModalVisible: true,
                    })
                  }}>
                  <Text style={{ color: '#FF0000', alignSelf: 'center' }}>
                    Report inappropriate
                  </Text>
                </TouchableOpacity>

                {/* Report*/}
              </View>
            </View>
          </Modal>
          {/*~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~ REPORT POPUP ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~ */}
          <Modal
            animationType="fade"
            transparent={true}
            visible={this.state.reportPopup}
            onRequestClose={() => {
              this.reportPopUp(!this.state.reportPopup);
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
                    style={{
                      color: '#3a7bd5',
                      fontSize: 20,
                      fontWeight: 'bold',
                    }}>
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
                      this.reportPopUp(!this.state.reportPopup);
                    }}>
                    <FontAwesome name="close" size={15} color="#cd5050" />
                  </TouchableOpacity>
                </View>
                {/* Add on press here to make Admin */}
                <TouchableOpacity
                  onPress={async () => {

                    this.reportPopUp(!this.state.reportPopup);
                    this.setState({
                      feedbackModalVisible: true,
                    })
                  }}
                  style={{
                    marginTop: 10,
                    borderTopColor: 'rgba(191,191,191,0.2)',
                    borderTopWidth: 2,
                    borderBottomColor: 'rgba(191,191,191,0.2)',
                    borderBottomWidth: 2,
                    paddingVertical: 10,
                  }}>
                  <Text style={{ color: '#FF0000', alignSelf: 'center' }}>
                    Report inappropriate
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
                    style={{
                      color: '#3a7bd5',
                      fontSize: 20,
                      fontWeight: 'bold',
                    }}>
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
                    if (this.props.connected) {
                      database()
                        .ref(
                          `hosts/${this.props.navigation.getParam('roomId')}/${this.state.selectedUser
                          }`,
                        )
                        .update({
                          value: -1,
                        })
                        .catch();
                    } else {
                      Toast.show('You are disconnected. Please re-connect');
                    }

                    this.removePermissionPopUp(
                      !this.state.removePermissionPopUp,
                    );
                  }}>
                  <Text style={{ color: '#7f7f7f', alignSelf: 'center' }}>
                    Make Moderator
                  </Text>
                </TouchableOpacity>
                {/* Add on press here to remove talk permission. */}
                <TouchableOpacity
                  style={{ paddingVertical: 10 }}
                  onPress={() => {
                    if (this.props.connected) {
                      database()
                        .ref(
                          `hosts/${this.props.navigation.getParam('roomId')}/${this.state.selectedUser
                          }`,
                        )
                        .remove(() => {
                          database()
                            .ref(
                              `audience/${this.props.navigation.getParam(
                                'roomId',
                              )}/${this.state.selectedUser}`,
                            )
                            .set({
                              value: Math.floor(new Date().getTime() / 1000),
                              photoUrl: this.state.selectedPhoto,
                            })
                            .catch();
                        })
                        .catch();
                    } else {
                      Toast.show('You are disconnected. Please re-connect');
                    }

                    this.removePermissionPopUp(
                      !this.state.removePermissionPopUp,
                    );
                  }}>
                  <Text style={{ color: '#7f7f7f', alignSelf: 'center' }}>
                    Remove Permission to Talk
                  </Text>
                </TouchableOpacity>

                {/* Report*/}

                <TouchableOpacity
                  style={{ paddingVertical: 10 }}
                  onPress={() => {
                    this.removePermissionPopUp(!this.state.removePermissionPopUp,);
                    this.setState({
                      feedbackModalVisible: true,
                    })
                  }}>
                  <Text style={{ color: '#FF0000', alignSelf: 'center' }}>
                    Report Inappropriate
                  </Text>
                </TouchableOpacity>

                {/* Report*/}
              </View>
            </View>
          </Modal>
        </SafeAreaView>
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
          marginTop: '15%',
          zIndex: 5,
          backgroundColor: '#3a7bd5',
          paddingTop: 5,
          paddingHorizontal: 15,
          borderRadius: 20,
          maxWidth: 300,
          transform: [{ translateY: this.state.bounceValue }],
        }}>
        <Text
          style={{
            color: '#fff',
            fontWeight: 'bold',
            textAlign: 'center',
            paddingTop: 12,
          }}>
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
    //console.log("MIC", this.props.micOn)
    return (
      <TouchableOpacity
        style={{
          width: screenWidth / 3 - 50,
          marginLeft: (screenWidth - 3 * (screenWidth / 3 - 50)) / 3,
        }}
        onPress={this.props.navigateToProfile}
        onLongPress={this.props.onReport}>
        <Box
          height={screenWidth / 3 - 40}
          width={screenWidth / 3 - 40}
          borderRadius={15}
          styleChildren={{ justifyContent: 'center' }}>
          <Image
            style={{
              height: screenWidth / 3 - 40,
              width: screenWidth / 3 - 40,
              alignSelf: 'center',
              borderColor: '#3a7bd5',
              borderWidth: this.props.micOn ? 4 : 0,
              borderRadius: 15,
            }}
            source={{ uri: this.props.profilePic }}
          />
        </Box>
        <Text
          style={{
            marginTop: -10,
            color: '#3a7bd5',
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
        <View
          style={{
            borderRadius: 10,
            position: 'absolute',
            top: 5,
            right: -15,
            overflow: 'hidden',
          }}>
          <Icon
            name="star"
            size={15}
            style={{
              // position: 'absolute',
              // top: 5,
              // right: -15,
              color: '#fff',
              backgroundColor: '#3a7bd5',
              padding: 3,
              // borderRadius: 10,
            }}
          />
        </View>
        <View
          style={{
            borderRadius: 10,
            position: 'absolute',
            top: 30,
            right: -15,
            overflow: 'hidden',
          }}>
          <Icon
            name={this.props.micOn ? "mic" : "mic-off"}
            size={15}
            style={{
              // position: 'absolute',
              // top: 5,
              // right: -15,
              color: '#fff',
              backgroundColor: '#3a7bd5',
              padding: 3,
              // borderRadius: 10,
            }}
          />
        </View>
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
        style={{
          width: screenWidth / 3 - 50,
          marginLeft: (screenWidth - 3 * (screenWidth / 3 - 50)) / 3,
        }}
        onPress={this.props.longPressOnHosts}>
        <Box
          height={screenWidth / 3 - 40}
          width={screenWidth / 3 - 40}
          borderRadius={15}
          styleChildren={{ justifyContent: 'center' }}>
          <Image
            style={{
              height: screenWidth / 3 - 40,
              width: screenWidth / 3 - 40,
              borderColor: '#3a7bd5',
              borderWidth: this.props.micOn ? 4 : 0,
              borderRadius: 15,
              alignSelf: 'center',
            }}
            source={{ uri: this.props.profilePic }}
          />
        </Box>
        <Text
          style={{
            marginTop: -10,
            color: '#3a7bd5',
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
        <View
          style={{
            borderRadius: 10,
            position: 'absolute',
            top: 5,
            right: -15,
            overflow: 'hidden',
          }}>
          <Icon
            name={this.props.micOn ? "mic" : "mic-off"}
            size={15}
            style={{
              // position: 'absolute',
              // top: 5,
              // right: -15,
              color: '#fff',
              backgroundColor: '#3a7bd5',
              padding: 3,
              // borderRadius: 10,
            }}
          />
        </View>
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
            <TouchableOpacity onPress={this.props.longPressOnQueue}>
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
                style={{ marginLeft: 4 }}>
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
                color: '#A1AFC3',
                overflow: 'hidden',
                width: 60,
                height: 15,
                fontSize: 10,
                textAlign: 'center',
                paddingHorizontal: 5,
                fontWeight: 'bold',
              }}>
              {this.props.username}
            </Text>
          </View>
        </View>
        <Text
          style={{
            position: 'absolute',
            top: 3,
            right: 5,
            // marginTop: 3,
            color: '#fff',
            fontSize: 10,
            paddingHorizontal: 3,
            borderRadius: 10,
            overflow: 'hidden',
            backgroundColor: '#3a7bd5',
          }}>
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
            colors={['#3a7bd5', '#00d2ff']}
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
      <TouchableOpacity onPress={this.props.pressFunction}>
        <Box height={35} width={100} borderRadius={17.5}>
          <View>
            <Text
              style={{
                marginTop: 5,
                fontSize: 15,
                alignSelf: 'center',
                fontWeight: 'bold',
                color: '#A1AFC3',
              }}>
              {this.props.name}
            </Text>
          </View>
        </Box>
      </TouchableOpacity>
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
                color="#3a7bd5"
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

  componentDidUpdate(prevProps, prevState) {
    if (this.props.micOnorNot !== prevProps.micOnorNot) {
      if (this.props.micOnorNot) {
        this.setState({ micON: true });
      } else {
        this.setState({ micON: false });
      }
    }
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
                color="#A1AFC3"
                size={25}
                style={{ alignSelf: 'center', marginTop: 7 }}
              />
            </Box>
          ) : (
              <Box height={40} width={40} borderRadius={10}>
                <Icon
                  name="mic-off"
                  color="#A1AFC3"
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

export class Participant extends Component {
  render() {
    return (
      <TouchableOpacity
        style={{
          width: screenWidth / 3 - 50,
          paddingLeft: (screenWidth - 3 * (screenWidth / 3 - 25)) / 3,
          // marginRight: (screenWidth - 3 * (screenWidth / 3 - 50)) / 3,
        }}
        onPress={this.props.longPressOnParticipant}>
        <Box
          height={screenWidth / 3 - 40}
          width={screenWidth / 3 - 40}
          borderRadius={15}>
          <Image
            style={{
              height: screenWidth / 3 - 40,
              width: screenWidth / 3 - 40,
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
export class CreateRoomButton extends Component {
  constructor(props) {
    super(props);

    this.state = {
      loading: this.props.loading === true ? true : false,
    };
  }

  componentDidUpdate(prevProps, prevState) {
    if (this.props.loading !== prevProps.loading) {
      if (this.props.loading === true) {
        this.setState({ loading: true });
      } else {
        this.setState({ loading: false });
      }
    }
  }

  render() {
    return (
      <TouchableOpacity onPress={this.props.createRoom}>
        <Box height={40} width={275} borderRadius={20}>
          <LinearGradient
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            colors={['#3a7bd5', '#00d2ff']}
            style={{
              height: 40,
              borderRadius: 20,
              width: 300,
              alignSelf: 'center',
              justifyContent: 'center',
              alignItems: 'center',
            }}>
            <View
              style={{
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: 'transparent',
                height: 40,
                width: 300,
              }}>
              {!this.state.loading && (
                <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 12 }}>
                  {this.props.text}
                </Text>
              )}
              {this.state.loading && (
                <PulseIndicator color="#3a7bd5" size={40} />
              )}
            </View>
          </LinearGradient>
        </Box>
      </TouchableOpacity>
    );
  }
}

class FeedbackModal extends Component {
  render() {
    return (
      <Modal
        animationType="fade"
        transparent={true}
        visible={this.props.feedbackModalVisible}>
        <View
          style={{
            flex: 1,
            justifyContent: 'center',
            alignItems: 'center',
            backgroundColor: 'rgba(0,0,0,0.2)',
          }}>
          <View
            style={{
              height: 280,
              width: '80%',
              borderWidth: 3,
              borderColor: '#e5e5e5',
              backgroundColor: 'rgb(233, 235, 244)',
              borderRadius: 10,
            }}>
            <View
              style={{
                flexDirection: 'row',
                justifyContent: 'space-between',
                marginTop: 10,
                alignItems: 'center',
                paddingHorizontal: 15,
              }}>
              <Text
                style={{
                  color: '#3a7bd5',
                  fontWeight: 'bold',
                  fontSize: 20,
                }}>
                Report Inappropriate
              </Text>
              <Icon
                name="x-circle"
                style={{ color: '#3a7bd5' }}
                size={25}
                onPress={this.props.toggleCreateRoomModal}
              />
            </View>
            <View
              style={{
                marginTop: 10,
                borderBottomColor: '#BFBFBF',
                borderBottomWidth: 2,
                borderRadius: 2,
                width: '100%',
                opacity: 0.2,
                marginBottom: 10,
              }}
            />
            <Box
              height={100}
              width={275}
              borderRadius={25}
              style={{ alignSelf: 'center', marginLeft: 10 }}>
              <TextInput
                placeholder="We will review it in under 24 hours and will take necessary action."
                multiline={true}
                numberOfLines={3}
                textAlignVertical="top"
                onChangeText={this.props.onChangeText}
                style={{
                  fontWeight: 'bold',
                  paddingHorizontal: 20,
                  width: '100%',
                  color: '#7f7f7f',
                  paddingTop: 15,
                }}
              />
            </Box>
            <View style={{ marginTop: 10, alignItems: 'center', width: '100%' }}>
              <CreateRoomButton
                height={40}
                width={0.6 * screenWidth}
                borderRadius={20}
                text="REPORT"
                createRoom={this.props.submitFunction}
              />
            </View>
          </View>
        </View>
      </Modal>
    );
  }
}

const mapStateToProps = (state) => {
  return {
    roomHosts: state.rooms.roomHosts,
    roomQueue: state.rooms.roomQueue,
    roomAudience: state.rooms.roomAudience,
    role: state.rooms.role,
    user: state.user,
    connected: state.rooms.connected,
    agoraHosts: state.rooms.agoraHosts,
    AmItalking: state.rooms.AmItalking,
    deepLinkID: state.rooms.deepLinkID
  };
};

export default connect(mapStateToProps)(audioRoom);
