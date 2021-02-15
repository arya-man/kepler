import React, { Component } from 'react';
import {
  Text,
  View,
  SafeAreaView,
  TouchableOpacity,
  Image,
  TouchableWithoutFeedback,
  FlatList,
  ActivityIndicator,
  Modal,
  TextInput,
  Platform,
  PermissionsAndroid,
  Dimensions,
  Linking
} from 'react-native';
import 'react-native-get-random-values'
import Icon from 'react-native-vector-icons/Feather';
import Material from 'react-native-vector-icons/MaterialIcons'
import Box from './neumorphButton';
import CBox from './customizableNeuButton';
import LinearGradient from 'react-native-linear-gradient';
import { connect } from 'react-redux';
import { withNavigation } from 'react-navigation';
import { GET_ROOMS, GET_CONNECTED, DEEP_LINK, CURRENT_TIMESTAMP } from '../redux/roomsRedux';
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

const screenWidth = Dimensions.get('window').width


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

      followRecommendationData: [],
      indexOfpersonToBeFollowed: 0
      deeplinkLandingForUpcomingRoomsModalVisible: false
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
  getRooms = () => {

    database().ref('rooms').once('value')
      .then((query) => {
        var arr = []
        query.forEach(doc => {
          var obj = { id: doc.key }
          obj = { ...obj, ...doc.val() }
          arr.push(obj)
          // console.log("OBJ", obj)
        })
        this.props.dispatch({
          type: GET_ROOMS,
          payload: arr
        })
      })
      .catch(() => {
        this.setState({ getError: true })
      })

    this.setState({ loading: false })
    this.setState({ refreshing: false })

  }

  async checkDeepLink() {
    // console.log("ID: ", this.props.deepLinkID)
    let roomId = this.props.deepLinkID;
    if (roomId !== 0) {

      this.props.dispatch({
        type: DEEP_LINK,
        payload: 0
      })
      //fetch data
      // console.log("fetching data for : ", roomId)
      /// @@todo aryaman fetch data, that will be stored in this.state/deepLinkData => then setthe modal based on the data
      database().ref(`rooms/${roomId}`).once('value', async (snap) => {

        var obj = {}

        if (snap.val() !== null) {

          var length = Object.keys(snap.val()['admin'])
          // console.log("LENGTH", length)
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
        else {

          this.setState({ deepLinkDone: true })

        }
      })
    }
  }


  _handleOpenURL = event => {
    // console.log("Liniking ", event)
    dynamicLinks().onLink(link => {
      // console.log("Inside: ", link)
      if (link.url.includes("https://keplr.org")) {
        var roomId = link.url.slice(link.url.lastIndexOf('/') + 1);
        //navigate to that part of the page
        database().ref(`rooms/${roomId}`).once('value', async (snap) => {

          var obj = {}

          if (snap.val() !== null) {

            var length = Object.keys(snap.val()['admin'])
            // console.log("LENGTH", length)
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
          else {

            this.setState({ deepLinkDone: true })

          }
        })

      }
    });
  };

  async componentDidMount() {

    Linking.addEventListener('url', this._handleOpenURL);

    this.props.dispatch({
      type: CURRENT_TIMESTAMP,
      payload: new Date().getTime()
    })

    database().ref('version').once('value', async snap => {

      var versionHere = VersionNumber.buildVersion

      if (versionHere >= snap.val()) {

        this.checkDeepLink()

        database().ref('rooms').once('value')
          .then((query) => {
            var arr = []
            query.forEach(doc => {
              var obj = { id: doc.key }
              obj = { ...obj, ...doc.val() }
              arr.push(obj)
            })
            this.props.dispatch({
              type: GET_ROOMS,
              payload: arr
            })
          })
          .catch(() => {
            this.setState({ getError: true })
          })

        var bioDone = await AsyncStorage.getItem('bioDone')

        if (bioDone === null) {

          await AsyncStorage.setItem('bioDone', 'done')

        }

        database().ref('dummy').on('value', snap => {

        })

        database().ref('.info/connected').on('value', snap => {
          this.props.dispatch({
            type: GET_CONNECTED,
            payload: snap.val()
          })
        })

        // this.getRooms()

        if (Platform.OS === 'ios') {
          var authorizationStatus = await messaging().requestPermission()

          if (authorizationStatus === messaging.AuthorizationStatus.AUTHORIZED || authorizationStatus === messaging.AuthorizationStatus.PROVISIONAL) {

            messaging().subscribeToTopic('all').catch()

          }
        }

        if (Platform.OS === 'android') {

          messaging().subscribeToTopic('all').catch()

        }

        this.setState({ loading: false })
        this.setState({ refreshing: false })

      }
      else {

        this.setState({ updateApp: true, loading: false, refreshing: false })

      }

    })
      .catch(async () => {

        this.checkDeepLink()
        database().ref('rooms').once('value')
          .then((query) => {
            var arr = []
            query.forEach(doc => {
              var obj = { id: doc.key }
              obj = { ...obj, ...doc.val() }
              arr.push(obj)
              // console.log("OBJ", obj)
            })
            this.props.dispatch({
              type: GET_ROOMS,
              payload: arr
            })
          })
          .catch(() => {
            this.setState({ getError: true })
          })

        var bioDone = await AsyncStorage.getItem('bioDone')

        if (bioDone === null) {

          await AsyncStorage.setItem('bioDone', 'done')

        }

        database().ref('dummy').on('value', snap => {

        })

        database().ref('.info/connected').on('value', snap => {
          this.props.dispatch({
            type: GET_CONNECTED,
            payload: snap.val()
          })
        })

        // this.getRooms()

        if (Platform.OS === 'ios') {
          var authorizationStatus = await messaging().requestPermission()

          if (authorizationStatus === messaging.AuthorizationStatus.AUTHORIZED || authorizationStatus === messaging.AuthorizationStatus.PROVISIONAL) {

            messaging().subscribeToTopic('all').catch()

          }
        }

        if (Platform.OS === 'android') {

          messaging().subscribeToTopic('all').catch()

        }

        this.setState({ loading: false })
        this.setState({ refreshing: false })

      })

  }

  componentDidUpdate(prevProps, prevState) {

    if (this.props.connected !== prevProps.connected) {

      if (this.props.connected) {

        Toast.show('Re-connected!', Toast.SHORT)

      }

    }

  }

  componentWillUnmount() {

    database().ref('dummy').off()
    database().ref('.info/connected').off()
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
        <View
          style={{
            marginLeft: 25,
            marginRight: 20,
            marginTop: 15,
            paddingTop: 5,
            paddingBottom: 10,
            borderTopWidth: 2,
            borderBottomWidth: 2,
            borderBottomColor: 'rgba(191,191,191,0.3)',
            borderTopColor: 'rgba(191,191,191,0.3)',
            backgroundColor: 'rgb(233, 235, 244)',
          }}>
          <Text style={{ fontSize: 20, color: "#3a7bd5", fontWeight: "bold" }}>Follow Someone</Text>
          <FlatList
            data={this.state.followRecommendationData}
            horizontal={true}
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
                    noOfFollowersOfPersonToBeFollowed: item.followers ? item.followers : 20,
                    noOfPeopleFollowingOfPersonToBeFollowed: item.following ? item.following : 91,
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
            flexDirection:'row',
            justifyContent: 'center'
          }}>
          <CreateRoomButton
            height={40}
            width={screenWidth/2 - 20}
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
            width={screenWidth/2 - 20}
            text="SCHEDULED ROOMS"
            borderRadius={20}
            createRoom={()=>
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
                <Icon
                  name="x-circle"
                  style={{ color: '#3a7bd5' }}
                  size={25}
                  onPress={this.toggleCreateRoomModal}
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
          roomName="Liverpool"
          roomDescription="You'll never walk alone! All of the above URL's will give you a new photo each time they are requested (provided there are enough photos to choose from given the filtering). However each can also be limited to only updating once per day or week. To do so, simply append "
          time="11:50 PM"
          date="12th March, 2021"
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
                    roomId: this.state.deepLinkData.id
                  })
                })
                  .then((res) => {
                    return res.json()
                  })
                  .then((res) => {
                    //console.log("TYPE OF TOKEN", typeof (res.token))
                    this.setState({ deeplinkLoading: false })
                    this.setState({ DeeplinkLandingModalVisible: false })
                    this.props.navigation.navigate('audioRoom', { caption: this.state.deepLinkData.caption, hashtag: this.state.deepLinkData.hashtag, roomId: this.state.deepLinkData.id, role: 0, agoraToken: res.token })
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
          // toggleCreateRoomModal={() =>
          //   this.setState({ feedbackModalVisible: false })
          // }
          // onChangeText={(text) => {
          //   this.setState({ feedback: text });
          // }}
          submitFunction={() => {
            // firestore().collection('feedback').add({
            //   text: this.state.feedback
            // })
            //   .then(() => {
            //     this.setState({ feedbackModalVisible: false })
            //   })
            //   .catch(() => {
            //     this.setState({ feedbackModalVisible: false })
            //   })
            Linking.openURL('https://play.google.com/store/apps/details?id=com.keplr')
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
            <ActivityIndicator size="large" color="#3a7bd5" />
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
                renderItem={({ item }) => {
                  var showText = 'showtext'
                  var count
                  if (item.nh !== undefined) {
                    count = item.nh
                  }
                  if (item.na !== undefined) {
                    if (item.nh !== undefined) {
                      count += item.na
                    }
                  }
                  return (
                    <Room
                      hashtag={item.hashtag}
                      caption={item.caption}
                      joinButton={async () => {
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
                                roomId: item.id
                              })
                            })
                              .then((res) => {
                                return res.json()
                              })
                              .then((res) => {

                                if (res.token !== 'error') {

                                  this.setState({ buttonFetching: false })
                                  this.props.navigation.navigate('audioRoom', { caption: item.caption, hashtag: item.hashtag, roomId: item.id, role: 0, agoraToken: res.token })

                                }
                                else {

                                  this.setState({ buttonFetching: false })
                                  Toast.showWithGravity('Whoops, a server error. Please try again', Toast.SHORT, Toast.CENTER)

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
                      fetching={this.state.buttonFetching}
                      id={item.id}
                      adminJSON={item.admin}
                      participantsJSON={item.participants}
                      navigateToListOfParticipants={() => {
                        // console.log('listofparticipants');
                      }}
                      participantsCallToAction={showText}
                    />
                  );
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
              <Icon
                name="x-circle"
                style={{ color: '#3a7bd5' }}
                size={25}
                onPress={this.props.followPopUpVisibleFunction}
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
class DeeplinkLandingForUpcomingRoomsModal extends Component{
  render() {
    return(
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
              <Icon
                name="x-circle"
                style={{ color: '#3a7bd5' }}
                size={25}
                onPress={this.props.toggleModal}
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
                // marginBottom: 10,
              }}
            />
            <Text ellipsizeMode="tail" numberOfLines={5} style={{ fontSize: 15, color: '#7f7f7f', marginTop: 5, paddingHorizontal: 20 }}>
              {this.props.roomDescription}
            </Text>
            <View style={{alignSelf:'center', marginTop: 20}}>
              <View style={{flexDirection: 'row', alignItems: 'center'}}>
                <Icon
                  name="calendar"
                  style={{ color: '#3a7bd5' }}
                  size={30}
                />
                <Text style={{color: '#3a7bd5', fontWeight:'bold', fontSize: 20, marginLeft: 10}}>{this.props.date}</Text>
              </View>
              <View style={{flexDirection: 'row', alignItems: 'center'}}>
                <Icon
                  name="clock"
                  style={{ color: '#3a7bd5' }}
                  size={30}
                />
                <Text style={{color: '#3a7bd5', fontWeight:'bold', fontSize: 20, marginLeft: 10}}>{this.props.time}</Text>
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
                createRoom={this.props.onJoinFromDeeplinkFunction}
                loading={this.props.loading}
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
              <Icon
                name="x-circle"
                style={{ color: '#3a7bd5' }}
                size={25}
                onPress={this.props.toggleModal}
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
                      source={{ uri: this.props.participantsJSON[item]['photoUrl'] }}
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
              <Text style={{ alignItems: 'center',fontWeight: 'bold', color: '#3a7bd5', fontSize: 20, width: "80%", textAlign: 'center' }}>
                {this.props.hashtag}
              </Text>
              <Text
                ellipsizeMode="tail"
                numberOfLines={7}
                style={{ textAlign: 'center',fontWeight: 'bold', color: '#7F8692'}}>
                {this.props.caption}
              </Text>
        </View>
        <View style={{flexDirection: 'row', alignItems: 'center', justifyContent:'center'}}>
          <View style={{alignSelf: 'center', alignItems:'center'}}>
            <Photo
              height={55}
              width={55}
              borderRadius={10}
              photoUrl={this.props.profilePic}
              navigateToProfile={()=>{
                console.log('hello');
              }}
            />
            <Text style={{fontWeight:'bold', color:'#3a7bd5'}}>{this.props.username}</Text>
          </View>
          <View style={{height: '80%', width: 2, backgroundColor: 'rgba(191,191,191,0.5)', marginLeft: 20}}/>
          <View style={{marginLeft: 20}}>
            <Text style={{fontWeight:'bold', color:'#3a7bd5', alignSelf:'center', fontSize: 20, textDecorationLine: 'underline'}}>Join On:</Text>
            <Text style={{fontWeight:'bold', color:'#3a7bd5', alignSelf:'center', marginTop: 10}}>{this.props.date}</Text>
            <Text style={{fontWeight:'bold', color:'#3a7bd5', alignSelf:'center'}}>{this.props.time}</Text>
          </View>
        </View>
        {this.props.startNow && (
          <View style={{ marginTop: 10, alignItems: 'center', width: '100%', marginBottom: 10 }}>
            <CreateRoomButton
              height={40}
              width={0.6 * screenWidth}
              borderRadius={20}
              text="START NOW"
              createRoom={this.props.startNowFunction}
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
  render(){
    return(
      <View>
        <View
          style={{
            alignItems: 'center',
            marginHorizontal: 25,
            marginTop: 10,
            marginBottom: 10,
            justifyContent: 'space-between',
          }}>
            <Text style={{ alignItems: 'center',fontWeight: 'bold', color: '#3a7bd5', fontSize: 20, width: "80%", textAlign: 'center' }}>
              {this.props.hashtag}
            </Text>
            <Text
              ellipsizeMode="tail"
              numberOfLines={7}
              style={{ textAlign: 'center',fontWeight: 'bold', color: '#7F8692'}}>
              {this.props.caption}
            </Text>
        </View>
        <View style={{alignItems: 'center'}}>
         <FlatList
              data={NEWDATA}
              horizontal={true}
              showsHorizontalScrollIndicator={false}
              renderItem={({item})=>(
                <View style={{alignSelf: 'center', alignItems:'center', justifyContent: 'center', marginLeft: 20}}>
                  <Photo
                    height={55}
                    width={55}
                    borderRadius={10}
                    photoUrl={item.profilePic}
                    navigateToProfile={()=>{
                      console.log('hello');
                    }}
                  />
                  <Text ellipsizeMode="tail" numberOfLines={1} style={{fontWeight:'bold', color:'#3a7bd5', marginLeft:-10}}>{item.username}</Text>
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
