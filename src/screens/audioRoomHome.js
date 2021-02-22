import React, { Component } from 'react';
import {
  Text,
  View,
  SafeAreaView,
  TouchableOpacity,
  Image,
  FlatList,
  Modal,
  TextInput,
  Platform,
  PermissionsAndroid,
  Dimensions,
  Linking
} from 'react-native';
import 'react-native-get-random-values'
import Icon from 'react-native-vector-icons/Feather';
import Material from 'react-native-vector-icons/MaterialIcons';
import Box from './neumorphButton';
import CBox from './customizableNeuButton';
import LinearGradient from 'react-native-linear-gradient';
import { connect } from 'react-redux';
import { withNavigation } from 'react-navigation';
import { GET_ROOMS, GET_CONNECTED, DEEP_LINK, CURRENT_TIMESTAMP } from '../redux/roomsRedux';
import {GET_USER} from '../redux/userRedux'
import ErrorPopup from './errorPopup'
import firestore from '@react-native-firebase/firestore'
import database from '@react-native-firebase/database'
import Toast from 'react-native-simple-toast'
import { v4 as uuidv4 } from 'uuid'
import {
  DotIndicator
} from 'react-native-indicators';
import messaging from '@react-native-firebase/messaging'
import AsyncStorage from '@react-native-async-storage/async-storage'
import VersionNumber from 'react-native-version-number';
import dynamicLinks from '@react-native-firebase/dynamic-links';
import LottieView from 'lottie-react-native'
import moment from 'moment';
import Share from 'react-native-share';
import RNFetchBlob from 'rn-fetch-blob';

const screenWidth = Dimensions.get('window').width

var firestoreUnsubscribe

class audioRoomHome extends Component {
  constructor(props) {
    super(props);

    this.state = {
      createRoomModalVisible: false,
      buttonFetching: false,
      hashtag: '',
      caption: '',
      feedback: '',
      feedbackModalVisible: false,
      DeeplinkLandingModalVisible: false,
      loading: true,
      getError: false,
      modalVisible: false,
      createError: false,
      createLoading: false,
      refreshing: false,
      location: '',
      deepLinkData: {},
      updateApp: false,
      deeplinkLoading: false,
      deepLinkDone: false,
      // --- Follow stuff ---
      nameOfPersonToBeFollowed: "Hasir",
      descriptionOfPersonToBeFollowed: "Hi im hasir watup",
      noOfFollowersOfPersonToBeFollowed: 2321,
      noOfPeopleFollowingOfPersonToBeFollowed: 88,
      profilePicOfPersonToBeFollowed: "https://source.unsplash.com/user/erondu",
      isFollowing: false,
      followPopUpVisible: false,
      showReconnectToast: false,
      followRecommendationData: [],
      indexOfpersonToBeFollowed: 0,
      deeplinkLandingForUpcomingRoomsModalVisible: false,
      randomNumber: 0
    };
    if (Platform.OS == 'android') {
      PermissionsAndroid.request('android.permission.RECORD_AUDIO')
    }
    this.getFollowSuggestion()
  }

  toggleCreateRoomModal = () => {
    this.setState({
      createRoomModalVisible: !this.state.createRoomModalVisible,
    });
  };
  onJoinFromDeeplink = () => {
    // console.log("Joined");
  }
  
  getFollowSuggestion = async () => {
    fetch('https://us-central1-keplr-4ff01.cloudfunctions.net/api/getFollowSuggestion', {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        username: this.props.user.user.username
      })
    })
      .then((res) => {
        return res.json()
      })
      .then((res) => {
        // console.log("Recom: ", res.recommendation)
        this.setState({ followRecommendationData: res.recommendation })
      })
      .catch(() => {
        Toast.showWithGravity('We encountered an error. Please Try Again', Toast.SHORT, Toast.CENTER)
      })
  }

  getRooms = async () => {

    var versionHere = VersionNumber.buildVersion
    // console.log("VERSION", versionHere)

    fetch('https://us-central1-keplr-4ff01.cloudfunctions.net/api/getRooms', {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        version: versionHere,
        os: Platform.OS
      })
    })
      .then((res) => {
        return res.json()
      })
      .then((res) => {

        // console.log("ROOMS", res)

        if (res.length === 1) {
          if (res[0] === 'error') {
            this.setState({ updateApp: true })
          }
          else {

            this.props.dispatch({
              type: GET_ROOMS,
              payload: res
            })

            this.setState({ randomNumber: Math.floor(Math.random() * res.length) })

          }
        }
        else {

          this.props.dispatch({
            type: GET_ROOMS,
            payload: res
          })

          this.setState({ randomNumber: Math.floor(Math.random() * res.length) })

        }

        this.setState({ loading: false, refreshing: false })

      })

  }


  async checkDeepLink() {
    let roomId = this.props.deepLinkID;
    if (roomId !== 0) {

      this.props.dispatch({
        type: DEEP_LINK,
        payload: 0
      })

      database().ref(`rooms/${roomId}`).once('value', async (snap) => {

        var obj = {}

        if (snap.val() !== null && snap.val().isActive) {

          var length = Object.keys(snap.val()['admin'])
          var text = ''

          if (length.length === 1) {
            text = `${[length[0]]} is already here`
          }
          else if (length.length === 2) {
            text = `${[length[0]]} and ${[length[1]]} are already here`
          }
          else {
            text = `${[length[0]]},${[length[1]]} and ${[length[2]]} are already here`
          }

          obj = { ...snap.val(), callToAction: text, id: snap.key }
          this.setState({ deepLinkData: obj })
          this.setState({ DeeplinkLandingModalVisible: true });

        }
        else if (snap.val() !== null && !snap.val().isActive) {

          var obj = {

            hashtag: snap.val().hashtag,
            caption: snap.val().caption,
            date: moment(snap.val().dateTime).format('MMMM Do YYYY'),
            time: moment(snap.val().dateTime).format('h:mm A')

          }

          this.setState({ deepLinkData: obj, deeplinkLandingForUpcomingRoomsModalVisible: true })

        }
        else if (snap.val() === null) {

          this.setState({ deepLinkDone: true })

        }
      })
    }
  }


  _handleOpenURL = event => {
    dynamicLinks().onLink(link => {
      if (link.url.includes("https://keplr.org")) {
        var roomId = link.url.slice(link.url.lastIndexOf('/') + 1);
        database().ref(`rooms/${roomId}`).once('value', async (snap) => {

          var obj = {}

          if (snap.val() !== null && snap.val().isActive) {

            var length = Object.keys(snap.val()['admin'])
            var text = ''

            if (length.length === 1) {
              text = `${[length[0]]} is already here`
            }
            else if (length.length === 2) {
              text = `${[length[0]]} and ${[length[1]]} are already here`
            }
            else {
              text = `${[length[0]]},${[length[1]]} and ${[length[2]]} are already here`
            }

            obj = { ...snap.val(), callToAction: text, id: snap.key }
            this.setState({ deepLinkData: obj })
            this.setState({ DeeplinkLandingModalVisible: true });

          }
          else if (snap.val() !== null && !snap.val().isActive) {

            var obj = {

              hashtag: snap.val().hashtag,
              caption: snap.val().caption,
              date: moment(snap.val().dateTime).format('MMMM Do YYYY'),
              time: moment(snap.val().dateTime).format('h:mm A')

            }

            this.setState({ deepLinkData: obj, deeplinkLandingForUpcomingRoomsModalVisible: true })

          }
          else if (snap.val() === null) {

            this.setState({ deepLinkDone: true })

          }
        })

      }
    });
  };

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
    }, dynamicLinks.ShortLinkType.SHORT);
    // console.log(link);
    return link;

  }
  // ------------- SHARE ROOM FUNCTION @aryaman: Dated: Feb 8, 2020 -> Add Deep Link in message on line 97 -------------------------
  onShareFunction = async (id) => {
    let shareLink = await this.deeplink(id);
    // this.setState({ shareLoading: true })
    let file_url = "https://firebasestorage.googleapis.com/v0/b/keplr-4ff01.appspot.com/o/keplr-share.png?alt=media&token=3c6ed63b-d7ea-418e-a911-4899113033c8";

    let imagePath = null;
    RNFetchBlob.config({
      fileCache: true
    })
      .fetch("GET", file_url)
      .then(resp => {
        imagePath = resp.path();
        return resp.readFile("base64");
      })
      .then(async base64Data => {
        var base64Data = `data:image/png;base64,` + base64Data;
        await Share.open({
          url: base64Data,
          message: "Join us on Keplr! \n" + shareLink
        });
        return fs.unlink(imagePath);
      }).catch(error => {
        // this.setState({ shareLoading: false })
      });
    // this.setState({ shareLoading: false })
  }

  async componentDidMount() {

    await this.getRooms()

    Linking.addEventListener('url', this._handleOpenURL);

    this.checkDeepLink()

    var bioDone = await AsyncStorage.getItem('bioDone')

    if (bioDone === null) {

      await AsyncStorage.setItem('bioDone', 'done')

    }

    database().ref('dummy').on('value', snap => {

    })

    firestoreUnsubscribe = firestore().collection('Users').doc(this.props.user.user.username).onSnapshot(async (snap) => {

      this.props.dispatch({
        type: GET_USER,
        payload: snap.data()
      })

    })

    database().ref('.info/connected').on('value', snap => {
      this.props.dispatch({
        type: GET_CONNECTED,
        payload: snap.val()
      })
    })

    if (Platform.OS === 'ios') {
      var authorizationStatus = await messaging().requestPermission()

      if (authorizationStatus === messaging.AuthorizationStatus.AUTHORIZED || authorizationStatus === messaging.AuthorizationStatus.PROVISIONAL) {

        messaging().subscribeToTopic('all').catch()

        var token = await messaging().getToken()

        if (this.props.user.user.token === token) {

          firestore().collection('Users').doc(this.props.user.user.username).update({
            token: token
          })

          // this.props.dispatch({
          //   type: GET_TOKEN,
          //   payload: token
          // })

        }

      }
    }

    if (Platform.OS === 'android') {

      messaging().subscribeToTopic('all').catch()

      var token = await messaging().getToken()

      if (this.props.user.user.token !== token) {

        firestore().collection('Users').doc(this.props.user.user.username).update({
          token: token
        })

        // this.props.dispatch({
        //   type: GET_TOKEN,
        //   payload: token
        // })

      }

    }

    this.props.dispatch({
      type: CURRENT_TIMESTAMP,
      payload: new Date().getTime()
    })

  }

  componentDidUpdate(prevProps, prevState) {

    if (this.props.connected !== prevProps.connected) {

      if (this.props.connected) {

        if (this.state.showReconnectToast) {

          Toast.show('Re-connected!', Toast.SHORT)

        }

      }
      else {
        this.setState({ showReconnectToast: true })
      }

    }

    if (this.props.deepLinkID !== prevProps.deepLinkID && prevProps.deepLinkID === 0) {

      // console.log("UPDATED ID: ", this.props.deepLinkID)
      let roomId = this.props.deepLinkID;
      if (roomId !== 0) {

        this.props.dispatch({
          type: DEEP_LINK,
          payload: 0
        })

        database().ref(`rooms/${roomId}`).once('value', async (snap) => {

          var obj = {}

          if (snap.val() !== null && snap.val().isActive) {

            var length = Object.keys(snap.val()['admin'])
            var text = ''

            if (length.length === 1) {
              text = `${[length[0]]} is already here`
            }
            else if (length.length === 2) {
              text = `${[length[0]]} and ${[length[1]]} are already here`
            }
            else {
              text = `${[length[0]]},${[length[1]]} and ${[length[2]]} are already here`
            }

            obj = { ...snap.val(), callToAction: text, id: snap.key }
            this.setState({ deepLinkData: obj })
            this.setState({ DeeplinkLandingModalVisible: true });

          }
          else if (snap.val() !== null && !snap.val().isActive) {

            var obj = {

              hashtag: snap.val().hashtag,
              caption: snap.val().caption,
              date: moment(snap.val().dateTime).format('MMMM Do YYYY'),
              time: moment(snap.val().dateTime).format('h:mm A')

            }

            this.setState({ deepLinkData: obj, deeplinkLandingForUpcomingRoomsModalVisible: true })

          }
          else if (snap.val() === null) {

            this.setState({ deepLinkDone: true })

          }
        })
      }

    }

  }

  componentWillUnmount() {

    database().ref('dummy').off()
    database().ref('.info/connected').off()
    firestoreUnsubscribe()
    Linking.removeEventListener('url', this._handleOpenURL);

  }

  render() {
    return (
      <SafeAreaView
        style={{
          flex: 1,
          backgroundColor: 'rgb(233, 235, 244)',
          // height: screenHeight,
        }}>
        <TopBar
          name={this.props.user.user.firstName}
          photoUrl={this.props.user.user.photoUrl}
          feedbackModal={() => this.setState({ feedbackModalVisible: true })}
          navigateToEditProfile={() =>
            this.props.navigation.navigate('profile')
          }
          referalModal={() => {
            this.setState({ referalModalVisible: true })
          }}
        />
        {/* ********************** Following/Followers stuff************************ */}
        {/* Try to render this somewhere in between the rooms flatlist, not on the top. Make it like in facebook, i.e, somewhere in between the feed. */}

        <FollowPopUp
          followPopUpVisible={this.state.followPopUpVisible}
          username={this.state.nameOfPersonToBeFollowed}
          description={this.state.descriptionOfPersonToBeFollowed}
          followers={this.state.noOfFollowersOfPersonToBeFollowed}
          following={this.state.noOfPeopleFollowingOfPersonToBeFollowed}
          profilePic={this.state.profilePicOfPersonToBeFollowed}
          isFollowing={this.state.isFollowing}
          onFollow={() => {
            this.setState({ isFollowing: !this.state.isFollowing })
            // Add Follow function logic here and based on that change isFollowing state.
            if (this.state.isFollowing) {
              let changeData = this.state.followRecommendationData
              changeData[this.state.indexOfpersonToBeFollowed]['isFollowing'] = false
              changeData[this.state.indexOfpersonToBeFollowed]['followers'] = this.state.noOfFollowersOfPersonToBeFollowed - 1
              this.setState({
                followRecommendationData: changeData,
                noOfFollowersOfPersonToBeFollowed: this.state.noOfFollowersOfPersonToBeFollowed - 1
              })
            } else {
              let changeData = this.state.followRecommendationData
              changeData[this.state.indexOfpersonToBeFollowed]['isFollowing'] = true
              changeData[this.state.indexOfpersonToBeFollowed]['followers'] = this.state.noOfFollowersOfPersonToBeFollowed + 1
              this.setState({
                noOfFollowersOfPersonToBeFollowed: this.state.noOfFollowersOfPersonToBeFollowed + 1,
                followRecommendationData: changeData,
              })
            }
            fetch('https://us-central1-keplr-4ff01.cloudfunctions.net/api/follow', {
              method: 'POST',
              headers: {
                Accept: 'application/json',
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({
                username: this.props.user.user.username,
                user_image_url: this.props.user.user.photoUrl,
                followed: this.state.nameOfPersonToBeFollowed,
                followed_image_url: this.state.profilePicOfPersonToBeFollowed,
                active: this.state.isFollowing ? false : true
              })
            })
              .then((res) => {
                return res.json()
              })
              .then((res) => {
                // console.log("Recom: ", res)
              })
              .catch(() => {
              })


          }}
          followPopUpVisibleFunction={() => {
            this.setState({ followPopUpVisible: false })
          }}
        />
        {/* *************************************************************** */}
        {/* ======================= UPCOMING ROOM FEED @aryaman uncomment it ========================== */}
        {/* <UpcomingRoom
          hashtag="Really Good Time on Keplr"
          caption="Join Hasir Mushtaq, Aryaman Shrey and Aditya Kumar taking on Modi Ji, and all the Bhakts in a once in a lifetime opportunity to get your queries answered in person."
          profilePic="https://source.unsplash.com/random"
          username="Hasir Mushtaq"
          date="October 13, 2021"
          time="10:00 a.m. IST"
          shareNowFunction={()=> {
            console.log('hello');
          }}
        /> */}
        {/* ==================================================================== */}
        {/* ````````````````` New Room UI use this and delete the old one @aryaman`````````````````````` */}
        {/* <NewRoom
          hashtag="Really Good Time on Keplr"
          caption="Join Hasir Mushtaq, Aryaman Shrey and Aditya Kumar taking on Modi Ji, and all the Bhakts in a once in a lifetime opportunity to get your queries answered in person."
          profilePic="https://source.unsplash.com/random"
        /> */}
        {/* ```````````````````````````````````````````````````````````````````````````````````````````` */}
        {/* ~~~~~~ This is create room button located at the bottom. ~~~~~~ */}
        <View
          style={{
            paddingBottom: 10,
            borderTopWidth: 2,
            borderTopColor: 'rgba(191,191,191,0.3)',
            backgroundColor: 'rgb(233, 235, 244)',
            alignItems: 'center',
            width: '100%',
            position: 'absolute',
            bottom: 0,
            zIndex: 5,
            flexDirection: 'row',
            justifyContent: 'center'
          }}>
          <CreateRoomButton
            height={40}
            width={screenWidth / 2 - 20}
            text="START ROOM"
            borderRadius={20}
            createRoom={async () => {
              var audio = true
              if (Platform.OS === 'android') {
                audio = await PermissionsAndroid.check('android.permission.RECORD_AUDIO')
              }
              if (this.props.connected) {
                if (audio) {
                  this.setState({ createRoomModalVisible: true })
                }
                else {
                  Toast.showWithGravity('Please give permission to access to audio in order to create a townhall', Toast.SHORT, Toast.CENTER)
                }
              }
              else {
                Toast.showWithGravity('Disconnected from internet. Can\'t create hall', Toast.SHORT, Toast.CENTER)
              }
            }}
          />
          <CreateRoomButton
            height={40}
            width={screenWidth / 2 - 20}
            text="SCHEDULED ROOMS"
            borderRadius={20}
            createRoom={() =>
              this.props.navigation.navigate('scheduleRoom')
            }
          />
        </View>
        {/* Create Room Popup */}
        <Modal
          animationType='fade'
          transparent={true}
          visible={this.state.createRoomModalVisible}
          onRequestClose={() => {
            Alert.alert('Modal has been closed.');
          }}>
          <View
            style={{
              flex: 1,
              justifyContent: 'center',
              alignItems: 'center',
              backgroundColor: 'rgba(0,0,0,0.2)',
            }}>
            <View
              style={{
                height: 285,
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
                    alignSelf: 'center'
                  }}>
                  Start a Room
                </Text>
                <TouchableOpacity
                onPress={this.toggleCreateRoomModal}
                >
                <Icon
                  name="x-circle"
                  style={{ color: '#3a7bd5' }}
                  size={25}
                  
                />
                </TouchableOpacity>
              </View>
              <View
                style={{
                  marginTop: 10,
                  borderBottomColor: '#BFBFBF',
                  borderBottomWidth: 2,
                  borderRadius: 2,
                  width: '100%',
                  opacity: 0.2,
                }}
              />
              <Box
                height={40}
                width={275}
                borderRadius={20}
                style={{ alignSelf: 'center', marginTop: 10 }}
                styleChildren={{ justifyContent: 'center' }}
              >
                <TextInput
                  placeholder="Title of the hall"
                  placeholderTextColor="#B5BFD0"
                  style={{
                    fontWeight: 'bold',
                    paddingHorizontal: 20,
                    width: '100%',
                  }}
                  onChangeText={(text) => {
                    this.setState({ hashtag: text });
                  }}
                />
              </Box>
              <Box
                height={70}
                width={275}
                borderRadius={20}
                style={{ alignSelf: 'center', marginLeft: 10 }}>
                <TextInput
                  placeholder="Description"
                  multiline={true}
                  numberOfLines={3}
                  textAlignVertical="top"
                  placeholderTextColor="#B5BFD0"
                  style={{
                    fontWeight: 'bold',
                    paddingHorizontal: 20,
                    width: '100%',
                    paddingTop: 10,
                  }}
                  onChangeText={(text) => {
                    this.setState({ caption: text });
                  }}
                />
              </Box>
              <View style={{ alignSelf: 'center', marginTop: 10 }}>
                <CreateRoomButton
                  height={40}
                  width={0.65 * screenWidth}
                  loading={this.state.createLoading}
                  borderRadius={20}
                  text="START ROOM"
                  createRoom={() => {

                    if (!this.state.createLoading) {
                      if (this.props.connected) {
                        if (this.state.hashtag !== '') {
                          this.setState({ createLoading: true })
                          var roomId = uuidv4()

                          fetch('https://us-central1-keplr-4ff01.cloudfunctions.net/api/createTownhall', {
                            method: 'POST',
                            headers: {
                              Accept: 'application/json',
                              'Content-Type': 'application/json'
                            },
                            body: JSON.stringify({
                              roomId: roomId,
                              hashtag: this.state.hashtag,
                              caption: this.state.caption,
                              username: this.props.user.user.username,
                              photoUrl: this.props.user.user.photoUrl

                            })
                          })
                            .then((res) => {
                              return res.json()
                            })
                            .then((res) => {

                              if (res.token !== 'error') {

                                this.setState({ createLoading: false })
                                this.toggleCreateRoomModal()
                                this.props.navigation.navigate('audioRoom', { caption: this.state.caption, hashtag: this.state.hashtag, roomId: roomId, role: 3, agoraToken: res.token })

                              }
                              else {
                                this.setState({ createLoading: false })
                                Toast.show('Whoops, a server error. Please try again', Toast.SHORT)
                              }

                            })
                            .catch(() => {
                              this.setState({ createLoading: false })
                              Toast.show('Whoops. Please try again', Toast.SHORT)
                            })
                        }
                        else {
                          Toast.show('Please enter the title of the hall', Toast.SHORT)
                        }
                      }
                      else {
                        Toast.show('Disconnected from internet. Can\'t create hall', Toast.SHORT)
                      }

                    }

                  }}
                />
              </View>
            </View>
          </View>
        </Modal>
        {/* -----------------------------------UPCOMING DEEPLINK LANDING MODAL - @aryaman Dated: Feb 14,2020 ---------------------------------------- */}
        <DeeplinkLandingForUpcomingRoomsModal
          deeplinkLandingForUpcomingRoomsModalVisible={this.state.deeplinkLandingForUpcomingRoomsModalVisible}
          // deeplinkLandingForUpcomingRoomsModalVisible={true}
          roomName={this.state.deepLinkData.hashtag}
          roomDescription={this.state.deepLinkData.caption}
          time={this.state.deepLinkData.time}
          date={this.state.deepLinkData.date}
          toggleModal={() => {
            this.setState({ deeplinkLandingForUpcomingRoomsModalVisible: false })
          }}
        // loading={this.state.deeplinkLoading}
        />
        {/* ------------------------------------------------- DEEPLINK LANDING MODAL for @aryaman Dated: Feb 7, 2021------------------------------------------------- */}
        <DeeplinkLandingModal
          DeeplinkLandingModalVisible={this.state.DeeplinkLandingModalVisible}
          roomName={this.state.deepLinkData.hashtag}
          roomDescription={this.state.deepLinkData.caption}
          participantsJSON={this.state.deepLinkData.admin}
          participantsCallToAction={this.state.deepLinkData.callToAction}
          toggleModal={() => {
            this.setState({ DeeplinkLandingModalVisible: false })
          }}
          loading={this.state.deeplinkLoading}
          onJoinFromDeeplinkFunction={async () => {
            if (this.props.connected) {
              var audio = true
              if (Platform.OS === 'android') {
                audio = PermissionsAndroid.check('android.permission.RECORD_AUDIO')
              }
              if (audio) {

                this.setState({ deeplinkLoading: true })

                fetch('https://us-central1-keplr-4ff01.cloudfunctions.net/api/agoraToken', {
                  method: 'POST',
                  headers: {
                    Accept: 'application/json',
                    'Content-Type': 'application/json'
                  },
                  body: JSON.stringify({
                    roomId: this.state.deepLinkData.id,
                    username: this.props.user.user.username
                  })
                })
                  .then((res) => {
                    return res.json()
                  })
                  .then((res) => {
                    //console.log("TYPE OF TOKEN", typeof (res.token))
                    if (res.token !== 'error') {

                      this.setState({ deeplinkLoading: false })
                      this.setState({ DeeplinkLandingModalVisible: false })
                      this.props.navigation.navigate('audioRoom', { caption: this.state.deepLinkData.caption, hashtag: this.state.deepLinkData.hashtag, roomId: this.state.deepLinkData.id, role: 0, agoraToken: res.token })

                    }
                    else {
                      this.setState({ deeplinkLoading: false })
                      Toast.showWithGravity('Whoops, server error. Please Try Again', Toast.SHORT, Toast.CENTER)
                    }
                  })
                  .catch(() => {
                    this.setState({ deeplinkLoading: false })
                    this.setState({ DeeplinkLandingModalVisible: false })
                    Toast.showWithGravity('We encountered an error. Please Try Again', Toast.SHORT, Toast.CENTER)
                  })
              }
              else {

                Toast.showWithGravity('Please give audio permission to join a townhall', Toast.SHORT, Toast.CENTER)
                this.setState({ DeeplinkLandingModalVisible: false })
              }

            }
            else {
              Toast.showWithGravity('You have to be connected to the Internet to join a townhall', Toast.SHORT, Toast.CENTER)
              this.setState({ DeeplinkLandingModalVisible: false })
            }
          }}
        />
        {/* --------------------------------------------------------------------------------------------------------------------------------------------------------- */}
        {/* Add feedback submit function here. */}
        <FeedbackModal
          feedbackModalVisible={this.state.feedbackModalVisible}
          toggleCreateRoomModal={() =>
            this.setState({ feedbackModalVisible: false })
          }
          onChangeText={(text) => {
            this.setState({ feedback: text });
          }}
          submitFunction={() => {
            firestore().collection('feedback').add({
              text: this.state.feedback
            })
              .then(() => {
                this.setState({ feedbackModalVisible: false })
              })
              .catch(() => {
                this.setState({ feedbackModalVisible: false })
              })
          }}
        />

        <UpdateModal
          feedbackModalVisible={this.state.updateApp}
          submitFunction={() => {

            if(Platform.OS === 'android') {

              Linking.openURL('https://play.google.com/store/apps/details?id=com.keplr')

            }
            else if (Platform.OS === 'ios') {

              Linking.openURL('https://apps.apple.com/in/app/keplr/id1543771904')

            }

          }}
        />

        {/* ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~` */}
        {/* While making a flatlist here add marginBottom of 60. */}
        <ErrorPopup
          title="Error"
          subTitle='There was an error while fetching townhalls. Please Retry'
          okButtonText="OK"
          clickFunction={() => {

            this.setState({ getError: false })
          }}
          modalVisible={this.state.getError}
        />

        <ErrorPopup
          title="Townhall was ended"
          subTitle='Please try joining some other townhall'
          okButtonText="OK"
          clickFunction={() => {

            this.setState({ deepLinkDone: false })
          }}
          modalVisible={this.state.deepLinkDone}
        />

        {this.state.loading ? (
          <View style={{ flex: 1, justifyContent: 'center', marginBottom: 60 }}>
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
              3,2,1...Liftoff
            </Text>
          </View>
        ) : this.props.rooms.length === 0 ? (
          <View
            style={{
              alignSelf: 'center',
              flex: 1,
              justifyContent: 'center',
              alignItems: 'center',
              width: '100%',
              marginBottom: 80,
            }}>
            <Image
              style={{ height: '50%', width: '60%', resizeMode: 'contain' }}
              source={require('../../Assets/image.png')}
            />
            <Text
              style={{
                alignSelf: 'center',
                color: '#7f7f7f',
                // fontWeight: 'bold',
                fontSize: 17,
                marginTop: 20,
              }}>
              {' '}
                  No TownHalls around you yet.
                </Text>
            <Text
              style={{
                alignSelf: 'center',
                color: '#7f7f7f',
                // fontWeight: 'bold',
                fontSize: 17,
                marginTop: -5,
              }}>
              {' '}
                  Go on, create one!
                </Text>
            <TouchableOpacity onPress={() => {
              this.setState({ loading: true })
              this.getRooms()
            }}>
              <Text
                style={{
                  alignSelf: 'center',
                  color: "#3a7bd5",
                  fontWeight: 'bold',
                  fontSize: 23,
                  marginTop: 5,
                }}
              >
                {' '}
                  Refresh
                </Text>
            </TouchableOpacity>
          </View>
        ) : (
              <FlatList
                style={{ marginBottom: 60, marginTop: 30 }}
                data={this.props.rooms}
                refreshing={this.state.refreshing}
                onRefresh={() => {
                  this.setState({ refreshing: true })
                  this.getRooms()
                }}
                keyExtractor={(item) => item['id']}
                showsVerticalScrollIndicator={false}
                renderItem={({ item, index }) => {

                  if (item.isActive) {

                    var keys = []
                    var values = []

                    if (item.admin !== undefined) {

                      keys = Object.keys(item.admin)
                      values = Object.values(item.admin)

                    }

                    var loading = false
                    if (this.state.buttonFetching === item.id) {
                      loading = true
                    }

                    return (
                      <View>
                        <NewRoom
                          hashtag={item.hashtag}
                          caption={item.caption}
                          adminKeys={keys}
                          adminValues={values}
                          loading={loading}
                          startNowFunction={() => {

                            if (this.props.connected) {
                              var audio = true
                              if (Platform.OS === 'android') {
                                audio = PermissionsAndroid.check('android.permission.RECORD_AUDIO')
                              }
                              if (audio) {

                                this.setState({ buttonFetching: item.id })

                                fetch('https://us-central1-keplr-4ff01.cloudfunctions.net/api/agoraToken', {
                                  method: 'POST',
                                  headers: {
                                    Accept: 'application/json',
                                    'Content-Type': 'application/json'
                                  },
                                  body: JSON.stringify({
                                    roomId: item.id,
                                    username: this.props.user.user.username
                                  })
                                })
                                  .then((res) => {
                                    return res.json()
                                  })
                                  .then((res) => {
                                    //console.log("TYPE OF TOKEN", typeof (res.token))
                                    if (res.token !== 'error') {

                                      this.setState({ buttonFetching: false })
                                      this.props.navigation.navigate('audioRoom', { caption: item.caption, hashtag: item.hashtag, roomId: item.id, role: 0, agoraToken: res.token })

                                    }
                                    else {
                                      this.setState({ buttonFetching: false })
                                      Toast.showWithGravity('Whoops, server error. Please Try Again', Toast.SHORT, Toast.CENTER)
                                    }
                                  })
                                  .catch(() => {
                                    this.setState({ buttonFetching: false })
                                    Toast.showWithGravity('We encountered an error. Please Try Again', Toast.SHORT, Toast.CENTER)
                                  })
                              }
                              else {

                                Toast.showWithGravity('Please give audio permission to join a townhall', Toast.SHORT, Toast.CENTER)
                              }

                            }
                            else {
                              Toast.showWithGravity('You have to be connected to the Internet to join a townhall', Toast.SHORT, Toast.CENTER)
                            }

                          }}
                        />
                        {this.state.randomNumber === index &&
                          <View
                            style={{
                              marginLeft: 25,
                              marginRight: 20,
                              marginTop: 15,
                              paddingTop: 5,
                              paddingBottom: 10,
                              // borderTopWidth: 2,
                              borderBottomWidth: 2,
                              borderBottomColor: 'rgba(191,191,191,0.3)',
                              // borderTopColor: 'rgba(191,191,191,0.3)',
                              backgroundColor: 'rgb(233, 235, 244)',
                            }}>
                            <Text style={{ fontSize: 20, color: "#3a7bd5", fontWeight: "bold" }}>Follow Someone</Text>
                            <FlatList
                              data={this.state.followRecommendationData}
                              horizontal={true}
                              keyExtractor={(item) => item.username}
                              showsHorizontalScrollIndicator={false}
                              keyExtractor={(item) => item.username}
                              renderItem={({ item, index }) => (
                                <FriendButton
                                  username={item.username}
                                  profilePic={item.profilePic}
                                  onPress={() => {
                                    this.setState({
                                      nameOfPersonToBeFollowed: item.username,
                                      descriptionOfPersonToBeFollowed: item.description ? item.description : "Hello There",
                                      noOfFollowersOfPersonToBeFollowed: item.followers,
                                      noOfPeopleFollowingOfPersonToBeFollowed: item.following,
                                      profilePicOfPersonToBeFollowed: item.profilePic ? item.profilePic : "https://source.unsplash.com/user/erondu",
                                      indexOfpersonToBeFollowed: index,
                                      followPopUpVisible: true,
                                      isFollowing: item.isFollowing
                                    })
                                  }}
                                />
                              )}
                            />
                          </View>

                        }
                      </View>
                    )

                  }
                  else {

                    return (
                      <View>
                        <UpcomingRoom
                          loading={false}
                          hashtag={item.hashtag}
                          caption={item.caption}
                          fetching={this.state.buttonFetching}
                          date={moment(item.dateTime).format('MMMM Do YYYY')}
                          time={moment(item.dateTime).format('h:mm A')}
                          startNow={false}
                          startNowFunction={() => { }}
                          shareNowFunction={async () => {
                            await this.onShareFunction(item.id)
                          }}
                          username={item.creator}
                          photoUrl={item.creatorPhotoUrl}
                          navigateToListOfParticipants={() => {
                            // console.log('listofparticipants');
                          }}
                        />
                        {this.state.randomNumber === index &&
                          <View
                            style={{
                              marginLeft: 25,
                              marginRight: 20,
                              marginTop: 15,
                              paddingTop: 5,
                              paddingBottom: 10,
                              // borderTopWidth: 2,
                              borderBottomWidth: 2,
                              borderBottomColor: 'rgba(191,191,191,0.3)',
                              // borderTopColor: 'rgba(191,191,191,0.3)',
                              backgroundColor: 'rgb(233, 235, 244)',
                            }}>
                            <Text style={{ fontSize: 20, color: "#3a7bd5", fontWeight: "bold" }}>Follow Someone</Text>
                            <FlatList
                              data={this.state.followRecommendationData}
                              horizontal={true}
                              keyExtractor={(item) => item.username}
                              showsHorizontalScrollIndicator={false}
                              keyExtractor={(item) => item.username}
                              renderItem={({ item, index }) => (
                                <FriendButton
                                  username={item.username}
                                  profilePic={item.profilePic}
                                  onPress={() => {
                                    this.setState({
                                      nameOfPersonToBeFollowed: item.username,
                                      descriptionOfPersonToBeFollowed: item.description ? item.description : "Hello There",
                                      noOfFollowersOfPersonToBeFollowed: item.followers,
                                      noOfPeopleFollowingOfPersonToBeFollowed: item.following,
                                      profilePicOfPersonToBeFollowed: item.profilePic ? item.profilePic : "https://source.unsplash.com/user/erondu",
                                      indexOfpersonToBeFollowed: index,
                                      followPopUpVisible: true,
                                      isFollowing: item.isFollowing
                                    })
                                  }}
                                />
                              )}
                            />
                          </View>

                        }
                      </View>
                    );

                  }


                }}
              />
            )}
      </SafeAreaView>
    );
    // }
  }
}
class FriendButton extends Component {
  render() {
    return (
      <View style={{ marginLeft: 5 }}>
        <TouchableOpacity onPress={this.props.onPress}>
          {/* <Box height={70} width={70} borderRadius={10}> */}
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
          {/* </Box> */}
        </TouchableOpacity>
        <Text
          ellipsizeMode="tail"
          numberOfLines={1}
          style={{
            color: '#8f8f8f',
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
    );
  }
}
class FollowPopUp extends Component {
  render() {
    return (
      <Modal
        animationType="fade"
        transparent={true}
        visible={this.props.followPopUpVisible}>
        <View
          style={{
            flex: 1,
            justifyContent: 'center',
            alignItems: 'center',
            backgroundColor: 'rgba(0,0,0,0.2)',
          }}>
          <View
            style={{
              width: '80%',
              borderWidth: 3,
              borderColor: '#e5e5e5',
              backgroundColor: 'rgb(233, 235, 244)',
              borderRadius: 10,
              // paddingRight: 15
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
                Follow
              </Text>
              <TouchableOpacity
                onPress={this.props.followPopUpVisibleFunction}
              >
              <Icon
                name="x-circle"
                style={{ color: '#3a7bd5' }}
                size={25}
              />
              </TouchableOpacity>
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
            <View style={{ flexDirection: 'row', alignItems: 'center', paddingLeft: 15 }}>
              <Photo
                height={65}
                width={65}
                borderRadius={10}
                photoUrl={this.props.profilePic}
              />
              <View style={{ marginRight: 90 }}>
                <Text
                  style={{
                    color: '#3a7bd5',
                    fontWeight: 'bold',
                    fontSize: 20,
                  }}>
                  {this.props.username}
                </Text>
                <Text style={{ color: '#7F8692' }}>{this.props.description}</Text>
              </View>
            </View>
            <View style={{ flexDirection: 'row', alignSelf: 'center', marginVertical: 15 }}>
              <View style={{ marginRight: 20, alignItems: 'center' }}>
                <Text style={{ fontSize: 17, fontWeight: 'bold', color: '#7F8692' }}>{this.props.followers}</Text>
                <Text style={{ color: '#7F8692' }}>Followers</Text>
              </View>
              <View style={{ alignItems: 'center' }}>
                <Text style={{ fontSize: 17, fontWeight: 'bold', color: '#7F8692' }}>{this.props.following}</Text>
                <Text style={{ color: '#7F8692' }}>Following</Text>
              </View>
            </View>
            <View
              style={{
                marginTop: 10,
                borderBottomColor: '#BFBFBF',
                borderBottomWidth: 2,
                borderRadius: 2,
                width: '100%',
                opacity: 0.2,
                marginBottom: 5,
              }}
            />
            <View style={{ marginBottom: 10, width: '100%', alignItems: 'center', marginLeft: 2 }}>
              <CreateRoomButton
                height={40}
                width={0.68 * screenWidth}
                borderRadius={20}
                text={this.props.isFollowing ? "FOLLOWING" : "FOLLOW"}
                createRoom={this.props.onFollow}
              // loading={this.props.loading}
              />
            </View>
          </View>
        </View>
      </Modal>
    );
  }
}
class DeeplinkLandingForUpcomingRoomsModal extends Component {
  render() {
    return (
      <Modal
        animationType="fade"
        transparent={true}
        visible={this.props.deeplinkLandingForUpcomingRoomsModalVisible}
      >
        <View
          style={{
            flex: 1,
            justifyContent: 'center',
            alignItems: 'center',
            backgroundColor: 'rgba(0,0,0,0.2)',
          }}>
          <View
            style={{
              paddingBottom: 15,
              width: '90%',
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
                paddingHorizontal: 20,
              }}>
              <Text
                ellipsizeMode="tail"
                numberOfLines={2}
                style={{
                  color: '#3a7bd5',
                  fontWeight: 'bold',
                  fontSize: 20,
                  width: "80%",
                }}>
                {this.props.roomName}
              </Text>
              <TouchableOpacity
              onPress={this.props.toggleModal}
              >
              <Icon
                name="x-circle"
                style={{ color: '#3a7bd5' }}
                size={25}
                
              />
              </TouchableOpacity>
            </View>
            <View
              style={{
                marginTop: 10,
                borderBottomColor: '#BFBFBF',
                borderBottomWidth: 2,
                borderRadius: 2,
                width: '100%',
                opacity: 0.2,
                // marginBottom: 10,
              }}
            />
            <Text ellipsizeMode="tail" numberOfLines={5} style={{ fontSize: 15, color: '#7f7f7f', marginTop: 5, paddingHorizontal: 20 }}>
              {this.props.roomDescription}
            </Text>
            <View style={{ alignSelf: 'center', marginTop: 20 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Icon
                  name="calendar"
                  style={{ color: '#3a7bd5' }}
                  size={30}
                />
                <Text style={{ color: '#3a7bd5', fontWeight: 'bold', fontSize: 20, marginLeft: 10 }}>{this.props.date}</Text>
              </View>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Icon
                  name="clock"
                  style={{ color: '#3a7bd5' }}
                  size={30}
                />
                <Text style={{ color: '#3a7bd5', fontWeight: 'bold', fontSize: 20, marginLeft: 10 }}>{this.props.time}</Text>
              </View>
            </View>
            <View
              style={{
                marginTop: 20,
                borderBottomColor: '#BFBFBF',
                borderBottomWidth: 2,
                borderRadius: 2,
                width: '100%',
                opacity: 0.2,
                marginBottom: 5,
              }}
            />
            <View style={{ width: '100%', alignItems: 'center', marginLeft: 2 }}>
              <CreateRoomButton
                height={40}
                width={0.68 * screenWidth}
                borderRadius={20}
                text="YOU WILL BE NOTIFIED"
                createRoom={this.props.toggleModal}
                loading={false}
              />
            </View>
          </View>
        </View>
      </Modal>
    );
  }
}
class DeeplinkLandingModal extends Component {
  render() {
    return (
      <Modal
        animationType="fade"
        transparent={true}
        visible={this.props.DeeplinkLandingModalVisible}
      >
        <View
          style={{
            flex: 1,
            justifyContent: 'center',
            alignItems: 'center',
            backgroundColor: 'rgba(0,0,0,0.2)',
          }}>
          <View
            style={{
              paddingBottom: 20,
              width: '90%',
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
                paddingHorizontal: 20,
              }}>
              <Text
                ellipsizeMode="tail"
                numberOfLines={2}
                style={{
                  color: '#3a7bd5',
                  fontWeight: 'bold',
                  fontSize: 20,
                  width: "80%",
                }}>
                {this.props.roomName}
              </Text>
              <TouchableOpacity
              onPress={this.props.toggleModal}
              >
              <Icon
                name="x-circle"
                style={{ color: '#3a7bd5' }}
                size={25}
                
              />
              </TouchableOpacity>
            </View>
            <View
              style={{
                marginTop: 10,
                borderBottomColor: '#BFBFBF',
                borderBottomWidth: 2,
                borderRadius: 2,
                width: '100%',
                opacity: 0.2,
                // marginBottom: 10,
              }}
            />
            <Text ellipsizeMode="tail" numberOfLines={5} style={{ fontSize: 15, color: '#7f7f7f', marginTop: 5, paddingHorizontal: 20 }}>
              {this.props.roomDescription}
            </Text>
            {/* Overview of participants */}
            <View style={{ alignSelf: 'center', marginTop: 35, marginBottom: 5 }}>
              <View
                style={{
                  flexDirection: 'row',
                  alignSelf: 'center',
                  marginLeft: 20,
                }}>
                {this.props.participantsJSON !== undefined && Object.keys(this.props.participantsJSON).map((item) => {
                  return (
                    <Image
                      key={item}
                      source={{ uri: this.props.participantsJSON[item] }}
                      style={{
                        marginLeft: -20,
                        height: 50,
                        width: 50,
                        borderRadius: 25,
                        borderWidth: 2,
                        borderColor: '#3a7bd5',
                      }}
                    />
                  );
                })}
              </View>
              <Text
                style={{
                  fontWeight: 'bold',
                  color: '#7F8692',
                  width: 180,
                  marginTop: 7,
                  textAlign: 'center',
                  fontSize: 12,
                }}>
                {this.props.participantsCallToAction}
              </Text>
            </View>
            <View style={{ marginTop: 7, width: '100%', alignItems: 'center', marginLeft: 2 }}>
              <CreateRoomButton
                height={40}
                width={0.68 * screenWidth}
                borderRadius={20}
                text="JOIN"
                createRoom={this.props.onJoinFromDeeplinkFunction}
                loading={this.props.loading}
              />
            </View>
          </View>
        </View>
      </Modal>
    )
  }
}

class UpdateModal extends Component {
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
              height: 150,
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
                Please update the app
              </Text>
              {/* <Icon
                name="x-circle"
                style={{ color: '#3a7bd5' }}
                size={25}
                onPress={this.props.toggleCreateRoomModal}
              /> */}
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
            {/* <Box
              height={70}
              width={275}
              borderRadius={25}
              style={{ alignSelf: 'center', marginLeft: 10 }}>
              <TextInput
                placeholder="Your feedback will remain anonymous."
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
            </Box> */}
            <View style={{ marginTop: 10, alignItems: 'center', width: '100%' }}>
              <CreateRoomButton
                height={40}
                width={0.6 * screenWidth}
                borderRadius={20}
                text="UPDATE"
                createRoom={this.props.submitFunction}
              />
            </View>
          </View>
        </View>
      </Modal>
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
              height: 250,
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
                Feedback
              </Text>
              <TouchableOpacity
                onPress={this.props.toggleCreateRoomModal}
              >
              <Icon
                name="x-circle"
                style={{ color: '#3a7bd5' }}
                size={25}
                
              />
              </TouchableOpacity>
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
              height={70}
              width={275}
              borderRadius={25}
              style={{ alignSelf: 'center', marginLeft: 10 }}>
              <TextInput
                placeholder="Your feedback will remain anonymous."
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
                width={0.7 * screenWidth}
                borderRadius={20}
                text="SUBMIT"
                createRoom={this.props.submitFunction}
              />
            </View>
          </View>
        </View>
      </Modal>
    );
  }
}
export class UpcomingRoom extends Component {
  render() {
    return (
      <View>
        <View
          style={{
            alignItems: 'center',
            marginHorizontal: 25,
            marginTop: 10,
            marginBottom: 10,
            justifyContent: 'space-between',
          }}>
          <Text style={{ alignItems: 'center', fontWeight: 'bold', color: '#3a7bd5', fontSize: 20, width: "80%", textAlign: 'center' }}>
            {this.props.hashtag}
          </Text>
          <Text
            ellipsizeMode="tail"
            numberOfLines={7}
            style={{ textAlign: 'center', fontWeight: 'bold', color: '#7F8692' }}>
            {this.props.caption}
          </Text>
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }}>
          <View style={{ alignSelf: 'center', alignItems: 'center' }}>
            <Photo
              height={55}
              width={55}
              borderRadius={10}
              photoUrl={this.props.photoUrl}
              navigateToProfile={() => {
                console.log('hello');
              }}
            />
            <Text style={{ fontWeight: 'bold', color: '#3a7bd5' }}>{this.props.username}</Text>
          </View>
          <View style={{ height: '80%', width: 2, backgroundColor: 'rgba(191,191,191,0.5)', marginLeft: 20 }} />
          <View style={{ marginLeft: 20 }}>
            <Text style={{ fontWeight: 'bold', color: '#3a7bd5', alignSelf: 'center', fontSize: 20, textDecorationLine: 'underline' }}>Join On:</Text>
            <Text style={{ fontWeight: 'bold', color: '#3a7bd5', alignSelf: 'center', marginTop: 10 }}>{this.props.date}</Text>
            <Text style={{ fontWeight: 'bold', color: '#3a7bd5', alignSelf: 'center' }}>{this.props.time}</Text>
          </View>
        </View>
        {this.props.startNow ? (
          <View style={{ marginTop: 10, alignItems: 'center', width: '100%', marginBottom: 10, flexDirection: 'row', justifyContent: 'center' }}>
            <CreateRoomButton
              height={40}
              width={0.5 * screenWidth - 40}
              borderRadius={20}
              text="START NOW"
              createRoom={this.props.startNowFunction}
              loading={this.props.loading}
            />
            <CreateRoomButton
              height={40}
              width={0.5 * screenWidth - 40}
              borderRadius={20}
              text="SHARE"
              createRoom={this.props.shareFunction}
            />
          </View>
        ) : (
            <View style={{ marginTop: 10, alignItems: 'center', width: '100%', marginBottom: 10 }}>
              <CreateRoomButton
                height={40}
                width={0.6 * screenWidth}
                borderRadius={20}
                text="SHARE"
                createRoom={this.props.shareNowFunction}
              />
            </View>
          )}
        <View
          style={{
            marginTop: 5,
            borderBottomColor: 'rgba(191,191,191,0.3)',
            borderBottomWidth: 2,
            borderRadius: 2,
            width: '85%',
            marginTop: 10,
            alignSelf: 'center',
          }}
        />
      </View>
    );
  }
}
class NewRoom extends Component {
  render() {
    return (
      <View>
        <View
          style={{
            alignItems: 'center',
            marginHorizontal: 25,
            marginTop: 10,
            marginBottom: 10,
            justifyContent: 'space-between',
          }}>
          <Text style={{ alignItems: 'center', fontWeight: 'bold', color: '#3a7bd5', fontSize: 20, width: "80%", textAlign: 'center' }}>
            {this.props.hashtag}
          </Text>
          <Text
            ellipsizeMode="tail"
            numberOfLines={7}
            style={{ textAlign: 'center', fontWeight: 'bold', color: '#7F8692' }}>
            {this.props.caption}
          </Text>
        </View>
        <View style={{ alignItems: 'center' }}>
          <FlatList
            data={this.props.adminKeys}
            horizontal={true}
            showsHorizontalScrollIndicator={false}
            keyExtractor={item => item}
            renderItem={({ item, index }) => (
              <View style={{ alignSelf: 'center', alignItems: 'center', justifyContent: 'center', marginLeft: 20 }}>
                <Photo
                  height={55}
                  width={55}
                  borderRadius={10}
                  photoUrl={this.props.adminValues[index]}
                  navigateToProfile={() => {
                    console.log('hello');
                  }}
                />
                <Text ellipsizeMode="tail" numberOfLines={1} style={{ fontWeight: 'bold', color: '#3a7bd5', marginLeft: -10 }}>{item}</Text>
              </View>
            )}
          />
        </View>

        <View style={{ marginTop: 10, alignItems: 'center', width: '100%', marginBottom: 10 }}>
          <CreateRoomButton
            height={40}
            width={0.6 * screenWidth}
            borderRadius={20}
            text="JOIN ROOM"
            createRoom={this.props.startNowFunction}
            loading={this.props.loading}
          />
        </View>
        <View
          style={{
            marginTop: 5,
            borderBottomColor: 'rgba(191,191,191,0.3)',
            borderBottomWidth: 2,
            borderRadius: 2,
            width: '85%',
            marginTop: 10,
            alignSelf: 'center',
          }}
        />
      </View>
    );
  }
}
// This is the room items, the props are:
// hashtag: String, the name of the room.
// caption: String, the caption/topic or whatever.
// joinButton: Function, add join navigation logic here.
// adminJSON: JSON, list of admins, the one with Elon Musk, Messi and AddyK. Each item must be in the following format:
//         //~~~~To keep a good UI try restricting number of admins shown to 3.~~~~~//
//         id: number, indicating the id in the list,
//         photoUrl: can be uri or require, the photo of the admin, eq: require('../../../Assets/stock.jpg'),
//         username:string,eg: 'Elon Musk',
//         bio:string, eg: "Author, feminist, critic. 'A Room of One's Own', out 9/29 from @HogarthPress. Author, feminist, critic. 'A Room of One's Own', out 9/29 from @HogarthPress.",
//         navigateToProfile: Add logic at =(1)= ,below see line 190. Shud be an onPress which navigates to profile,
// particaipantJSON:  JSON, list of participants, Each item will have:
//        //~~~~To keep a good UI try restricting number of participantsList shown to 4.~~~~~//
//        id: number, indicating the id in the list,
//        photoUrl: can be uri or require, the photo of the admin, eq:require('../../../Assets/stock.jpg'),
// navigateToListOfParticipants: Function, onPress it shud navigate to show a list of users in this room.
// participantsCallToAction: String, saying who all are hanging in this room.
// ~~~~~~~~~~~~~~~~~~CHANGE LINE 190 ACCORDINGLY.~~~~~~~~~~~~~~~
// Check below for more comments.
export class Room extends Component {
  render() {
    var load = false;
    if (this.props.fetching !== false) {
      if (this.props.id === this.props.fetching) {
        load = true;
      }
    }

    return (
      <View>
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            marginHorizontal: 25,
            justifyContent: 'space-between',
          }}>
          <View style={{ marginTop: 10 }}>
            <Text style={{ fontWeight: 'bold', color: '#3a7bd5' }}>
              {this.props.hashtag}
            </Text>
            <Text
              ellipsizeMode="tail"
              numberOfLines={1}
              style={{ fontWeight: 'bold', color: '#7F8692', width: 270 }}>
              {this.props.caption}
            </Text>
          </View>
          <JoinButton
            joinButton={this.props.joinButton}
            fetching={this.props.fetching}
            shouldLoad={load}
            key={`join${this.props.id}`}
          />
        </View>
        {this.props.adminJSON !== undefined && Object.keys(this.props.adminJSON).map((item) => {
          return (
            <PhotoAndBio
              key={item}
              photoUrl={this.props.adminJSON[item]}
              username={item}
              bio=''
              // ~~~~~~~~~~~~~~~~~  =(1)= Add navigate to Profile Logic here, per item of JSON. ~~~~~~~~~~~~~~~~~~~~~~~~~~~~
              navigateToProfile={() => {
                // console.log(item.navigateToProfile);
              }}
            />
          );
        })}
        <View style={{ alignSelf: 'center', marginTop: 5 }}>
          {/* <View
            style={{
              flexDirection: 'row',
              alignSelf: 'center',
              marginLeft: 25,
            }}>
            {this.props.participantsJSON !== undefined && Object.keys(this.props.participantsJSON).map((item) => {
              return (
                <Image
                  key={item}
                  source={{ uri: this.props.participantsJSON[item] }}
                  style={{
                    marginLeft: -20,
                    height: 50,
                    width: 50,
                    borderRadius: 25,
                    borderWidth: 2,
                    borderColor: '#3a7bd5',
                  }}
                />
              );
            })}
          </View> */}
          <Text
            style={{
              fontWeight: 'bold',
              color: '#7F8692',
              width: 180,
              marginTop: 7,
              textAlign: 'center',
              fontSize: 12,
            }}
            onPress={this.props.navigateToListOfParticipants}>
            {this.props.participantsCallToAction}
          </Text>
        </View>
        <View
          style={{
            marginTop: 5,
            borderBottomColor: 'rgba(191,191,191,0.3)',
            borderBottomWidth: 2,
            borderRadius: 2,
            width: '85%',
            marginTop: 10,
            alignSelf: 'center',
          }}
        />
      </View>
    );
  }
}
export class TopBar extends Component {
  render() {
    // console.log("PHOTOURL",this.props.photoUrl)
    return (
      <View style={{ marginLeft: 25 }}>
        <View
          style={{
            flexDirection: 'row',
            justifyContent: 'space-between',
            paddingRight: 10,
            backgroundColor: 'rgb(233, 235, 244)',
          }}>
          <View style={{ marginTop: 20, marginLeft: 5 }}>
            <TouchableOpacity style={{ marginLeft: -3 }} onPress={this.props.feedbackModal}>
              <Material
                name="error-outline"
                color="#7F8692"
                size={25}
              />
            </TouchableOpacity>
            <Text style={{ fontSize: 20, color: '#7F8692', marginTop: 15 }}>
              Hey,
            </Text>
          </View>
          <View style={{ marginTop: 10 }}>
            <CBox
              height={100}
              width={100}
              borderRadius={15}
              borderBlack={25}
              radiusBlack={10}
              xBlack={15}
              yBlack={15}
              borderWhite={10}
              radiusWhite={10}
              xWhite={-1}
              yWhite={-1}
              style={{ marginLeft: 4 }}>
              <Image
                style={{ height: 100, width: 100, borderRadius: 15 }}
                source={{
                  uri: this.props.photoUrl
                }}
              />
            </CBox>
            <TouchableOpacity
              style={{
                position: 'absolute',
                top: -4,
                right: 6,
                zIndex: 2,
                alignItems: 'center',
                justifyContent: 'center',
                height: 30,
                width: 30,
                borderRadius: 15,
                backgroundColor: 'rgb(233, 235, 244)',
                elevation: 10,
              }}
              onPress={this.props.navigateToEditProfile}>
              <Icon name="edit" color="#3a7bd5" size={20} />
            </TouchableOpacity>
          </View>
        </View>
        <Text
          ellipsizeMode="tail"
          numberOfLines={1}
          style={{
            color: '#3a7bd5',
            fontSize: 45,
            fontWeight: 'bold',
            marginTop: -55,
            width: '55%',
          }}>
          {/* Aryaman */}
          {this.props.name}
        </Text>
        <Text style={{ color: 'rgba(0,0,0,0.8)', fontSize: 20, marginTop: -5 }}>
          Let's explore something new.
        </Text>
      </View>
    );
  }
}
export class CreateRoomButton extends Component {

  constructor(props) {
    super(props)

    this.state = {
      loading: (this.props.loading === true ? true : false)
    }
  }

  componentDidUpdate(prevProps, prevState) {

    if (this.props.loading !== prevProps.loading) {

      if (this.props.loading === true) {
        this.setState({ loading: true })
      }
      else {
        this.setState({ loading: false })
      }

    }

  }

  render() {
    return (
      <TouchableOpacity
        onPress={this.props.createRoom}>
        <Box height={this.props.height} width={this.props.width} borderRadius={this.props.borderRadius}>
          <LinearGradient
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            colors={['#3a7bd5', '#00d2ff']}
            style={{
              height: this.props.height,
              borderRadius: this.props.borderRadius,
              width: this.props.width,
              alignSelf: 'center',
              justifyContent: 'center',
              alignItems: 'center',
            }}>
            <View
              style={{
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: 'transparent',
                height: this.props.height,
                width: this.props.width,
              }}
            >
              {!this.state.loading &&
                <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 12 }}>
                  {this.props.text}
                </Text>
              }
              {this.state.loading &&
                <DotIndicator color="#fff" size={10} betweenSpace={0} count={3} />
              }
            </View>
          </LinearGradient>
        </Box>
      </TouchableOpacity>
    );
  }
}
export class JoinButton extends Component {
  render() {
    return (
      <Box height={40} width={60} borderRadius={20}>
        <LinearGradient
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          colors={['#3a7bd5', '#00d2ff']}
          style={{
            height: 40,
            borderRadius: 20,
            width: 60,
            borderWidth: 1,
            borderColor: '#e5e5e5',
            alignSelf: 'center',
            justifyContent: 'center',
          }}>
          {/* <Icon
            onPress={this.props.joinButton}
            name="user-plus"
            color="#fff"
            size={20}
            style={{alignSelf: 'center'}}
          /> */}
          {!this.props.shouldLoad && (
            <TouchableOpacity
              style={{
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: 'transparent',
                height: 40,
                width: 60,
              }}
              onPress={this.props.joinButton}>
              <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 12 }}>
                JOIN
              </Text>
            </TouchableOpacity>
          )}
          {this.props.shouldLoad && (
            <DotIndicator color="#fff" size={5} betweenSpace={0} count={3} />
          )}
        </LinearGradient>
      </Box>
    );
  }
}
export class Photo extends Component {
  render() {
    return (
      <Box height={this.props.height} width={this.props.width} borderRadius={this.props.borderRadius}>
        <TouchableOpacity
          style={{
            height: this.props.height,
            width: this.props.width,
            borderRadius: 10,
            backgroundColor: 'rgb(233, 235, 244)',
            borderWidth: 1,
            borderColor: '#e5e5e5',
            alignSelf: 'center',
            justifyContent: 'center',
          }}
          onPress={this.props.navigateToProfile}>
          <Image
            source={{ uri: this.props.photoUrl }}
            style={{ height: this.props.height, width: this.props.width }}
          />
        </TouchableOpacity>
      </Box>
    );
  }
}
export class PhotoAndBio extends Component {
  render() {
    return (
      <View
        style={{
          flexDirection: 'row',
          paddingHorizontal: this.props.isDeeplinkLanding ? 40 : 25,
          alignItems: 'center',
        }}>
        <Photo
          height={55}
          width={55}
          borderRadius={10}
          photoUrl={this.props.photoUrl}
          navigateToProfile={this.props.navigateToProfile}
        />
        <View style={{ marginRight: 70, marginLeft: this.props.isDeeplinkLanding ? 5 : 10 }}>
          <Text
            onPress={this.props.navigateToProfile}
            style={{ fontWeight: 'bold', color: '#3a7bd5' }}>
            {this.props.username}
          </Text>
          <Text
            style={{ fontWeight: 'bold', color: '#7F8692', fontSize: 12 }}
            ellipsizeMode="tail"
            numberOfLines={2}>
            {this.props.bio}
          </Text>
        </View>
      </View>
    );
  }
}

const mapStateToProps = (state) => {
  return {
    rooms: state.rooms.rooms,
    user: state.user,
    connected: state.rooms.connected,
    deepLinkID: state.rooms.deepLinkID,
    timestamp: state.rooms.timestamp
  };
};

export default connect(mapStateToProps)(withNavigation(audioRoomHome));
