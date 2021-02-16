import React, { Component } from 'react';
import {
  Text,
  View,
  Image,
  TextInput,
  TouchableWithoutFeedback,
  KeyboardAvoidingView,
  Keyboard,
  TouchableOpacity,
  ActivityIndicator,
  Dimensions,
  Platform,
  SafeAreaView
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Box from '../screens/neumorphButton';
import Icon from 'react-native-vector-icons/Feather';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import ImagePicker from 'react-native-image-crop-picker'
import { GET_USER } from '../redux/userRedux'
import { connect } from 'react-redux'
import firestore from "@react-native-firebase/firestore"
import storage from "@react-native-firebase/storage"
import AsyncStorage from "@react-native-async-storage/async-storage"
import ErrorPopup from './errorPopup'
import { persistor } from '../redux'
import auth from '@react-native-firebase/auth'
import Video from 'react-native-video'
import {BackButtonAndTitle} from './scheduleRoom';
import { ScrollView } from 'react-native-gesture-handler';

const screenHeight = Dimensions.get('window').height
const screenWidth = Dimensions.get('window').width
import LottieView from 'lottie-react-native'

export class openingScreen extends Component {
  constructor(props) {
    super(props);
    this.state = {
      keyboardOn: false,
      imageUpdated: false,
      photoUrl: this.props.user.user.photoUrl, //@todo: fill the real data 
      firstName: this.props.user.user.firstName, //@todo: fill the real data
      lastName: this.props.user.user.lastName, //@todo: fill the real data
      bio: this.props.user.user.bio, //@todo: fill the real data
      username: this.props.user.user.username,// @todo: fill the real data
      error: "",
      isLoading: false,
      authmodalVisible: false,
      authMessage: '',
      followers:this.props.user.user.followers,
      following:this.props.user.user.following
    };
    // console.log("Hello", this.props.user.user.photoUrl)
    this.keyboardCheck = this.keyboardCheck.bind(this);
    this.keyboardCheck();
  }
  onChangeText = (key, val) => {
    this.setState({ [key]: val });
  };
  doneFunction = async () => {
    if (this.state.firstName == '' || this.state.lastName == '' || this.state.bio == '') {
      this.setState({
        authmodalVisible: true,
        authMessage: "Please Fill all the Fields!"
      })
    }
    this.setState({ isLoading: true })

    if (this.state.imageUpdated) {
      const ref = storage().ref(this.state.username.toLowerCase() + '/dp.png');
      await ref.putFile(this.state.photoUrl);
      var url = await ref.getDownloadURL();
      firestore()
        .collection('Users')
        .doc(this.state.username.toLowerCase())
        .update({
          firstName: this.state.firstName,
          lastName: this.state.lastName,
          bio: this.state.bio,
          photoUrl: url,
          //avatar: firestore.Blob.fromBase64String(`data:${this.state.mime};base64,${BASE64}`)
        })
        .then(() => {
          firestore()
            .collection("Users")
            .doc(this.state.username.toLowerCase())
            .get()
            .then(async function (user) {
              // console.log(user)
              var log = user['_data']
              this.props.dispatch({
                type: GET_USER,
                payload: log
              })
              //await AsyncStorage.setItem('data', JSON.stringify(user["_data"]));
              this.props.navigation.goBack()
            }.bind(this))
            .catch(function (error) {
              const { code, message } = error;
              this.setState({ authMessage: message })
            });
          //this.props.navigation.navigate("openingScreen")
          // console.log('User updated!');
        })
        .catch((error) => {
          // handle failure
          // console.log(error)
          this.setState({ isLoading: false })
          this.setState({ authMessage: `Error: ${error.code} | ${error.description}` })
        });
    } else {
      firestore()
        .collection('Users')
        .doc(this.state.username.toLowerCase())
        .update({
          firstName: this.state.firstName,
          lastName: this.state.lastName,
          bio: this.state.bio,
        })
        .then(() => {
          firestore()
            .collection("Users")
            .doc(this.state.username.toLowerCase())
            .get()
            .then(async function (user) {
              // console.log(user)
              var log = user['_data']
              this.props.dispatch({
                type: GET_USER,
                payload: log
              })
              await AsyncStorage.setItem('data', JSON.stringify(user["_data"]));
              this.setState({ isLoading: false })
              this.props.navigation.goBack()
            }.bind(this))
            .catch(function (error) {
              const { code, message } = error;
              this.setState({ isLoading: false })
              this.setState({ authMessage: message })
            });
          // console.log('User updated!');
        })
        .catch((error) => {
          // handle failure
          // console.log(error)
          this.setState({ isLoading: false })
          this.setState({ authMessage: `Error: ${error.code} | ${error.description}` })
        });
    }
    //this.setState({ isLoading: false })
    // console.log('DONE');
  };
  logOutFunction = async () => {
    await auth().signOut()
    var keys = await AsyncStorage.getAllKeys()
    await AsyncStorage.multiRemove(keys)
    await persistor.purge()
    this.props.navigation.navigate('auth')
  }
  keyboardCheck = () => {
    this.keyboardDidShowListener = Keyboard.addListener(
      'keyboardDidShow',
      this._keyboardDidShow,
    );
    this.keyboardDidHideListener = Keyboard.addListener(
      'keyboardDidHide',
      this._keyboardDidHide,
    );
  };

  componentDidUpdate(prevProps, prevState) {
    if (this.state.authMessage !== prevState.authMessage && this.state.authMessage !== '') {
      this.setState({ authmodalVisible: true })
    }
  }

  componentWillUnmount() {
    this.keyboardDidShowListener.remove();
    this.keyboardDidHideListener.remove();
  }

  _keyboardDidShow = () => {
    // console.log('ON');
    // this.changeKeyboardState(true);
    this.setState({ keyboardOn: true });
  };

  _keyboardDidHide = () => {
    // console.log('OFF');
    // this.changeKeyboardState(false);
    this.setState({ keyboardOn: false });
  };
  render() {
    if (this.state.isLoading) {
      return (
        <View style={{ flex: 1, justifyContent: "center" }}>
          <View style={{ flex: 1, justifyContent: "center" }}>
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
          fontSize: 14,
          fontWeight: 'bold', alignSelf: 'center'
        }}>
          Buckle up...
        </Text>
      </View>
        </View>
        </View>
      )
    }
    return (
      <SafeAreaView style={{ flex:1, backgroundColor: 'rgb(233, 235, 244)' }}>
        <ScrollView>
          <KeyboardAwareScrollView contentContainerStyle={{flex: 1}} scrollEnabled={true}>
            <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
              <View style={{flex: 1}}>
                <BackButtonAndTitle navigation={this.props.navigation} title="Edit Profile"/>
                <ErrorPopup
                  title="Error"
                  subTitle={this.state.authMessage}
                  okButtonText="OK"
                  clickFunction={() => {
                    this.setState({ authMessage: '' })
                    this.setState({ authmodalVisible: !this.state.authmodalVisible }); //Always keep this thing here
                  }}
                  modalVisible={this.state.authmodalVisible}
                />
                <View style={{ alignSelf: 'center', marginTop: 10, justifyContent: 'center'  }}>
                    <TouchableOpacity
                      onPress={async () => {
                        try {
                          var image = await ImagePicker.openPicker({
                            height: 500,
                            width: 500,
                            cropping: true
                          })
                          this.setState({
                            photoUrl: Platform.OS === 'ios' ? image['path'].replace('file://', '') : image['path'],
                            mime: image['mime'],
                            imageUpdated: true
                          })
                        } catch (error) {
                          this.setState({ error: error })
                        }
                      }}
                    
                    >
                      <Box
                        height={102}
                        width={102}
                        borderRadius={16}
                        style={{ alignSelf: 'center' }}>
                        <Image
                          source={{
                            uri:
                              this.state.photoUrl == undefined
                                ? 'https://style.anu.edu.au/_anu/4/images/placeholders/person.png'
                                : this.state.photoUrl,
                          }}
                          style={{
                            height: 100,
                            width: 100,
                            borderRadius: 15,
                            // resizeMode: "contain",
                          }}
                        />
                        <View style={{
                          position: 'absolute',
                          bottom: 0,
                          // fontSize: 10,
                          alignSelf: 'center',
                          // color: '#fff',
                          // fontWeight: 'bold',
                          backgroundColor: '#3a7bd5',
                          justifyContent: 'center',
                          width: '100%',
                          // paddingHorizontal: '30%',
                          paddingVertical: 1.5,
                          alignItems: 'center'
                        }}>
                          <Text
                            style={{
                              // position: 'absolute',
                              // bottom: 0,
                              fontSize: 10,
                              alignSelf: 'center',
                              color: '#fff',
                              fontWeight: 'bold',
                              // backgroundColor: '#3a7bd5',
                              justifyContent: 'center',
                              // width: '100%',
                              // paddingHorizontal: '30%',
                              // paddingVertical: 1.5,
                              // alignItems: 'center'
                            }}>
                            EDIT
                        </Text>
                        </View>
                      </Box>
                    </TouchableOpacity>
                    <Text 
                    style={{
                      color: '#3a7bd5',
                      fontSize: 25,
                      fontWeight: 'bold',
                      marginTop: -5,
                      alignSelf: 'center',
                      marginRight:20
                    }}
                    >
                      {"@"+this.state.username}
                    </Text>
                    <View style={{flexDirection:'row', alignSelf:'center', marginVertical: 15}}>
                      <View style={{marginRight: 20, alignItems: 'center'}}>
                        <Text style={{fontSize: 20, fontWeight:'bold', color:'#7F8692'}}>{this.state.followers}</Text>
                        <Text style={{color:'#7F8692'}}>Followers</Text>
                      </View>
                      <View style={{alignItems: 'center'}}>
                        <Text style={{fontSize: 20, fontWeight:'bold', color:'#7F8692'}}>{this.state.following}</Text>
                        <Text style={{color:'#7F8692'}}>Following</Text>
                      </View>
                    </View>
                  </View>
                  {/* <KeyboardAvoidingView behavior="padding"> */}
                      <View style={{ marginTop: 10 }}>
                        <Box
                          height={50}
                          width={300}
                          borderRadius={25}
                          style={{ alignSelf: 'center' }}
                          styleChildren={{ justifyContent: 'center' }}
                        >
                          <TextInput
                            placeholder="First Name"
                            defaultValue={this.state.firstName}
                            placeholderTextColor="#B5BFD0"
                            style={{
                              fontWeight: 'bold',
                              paddingHorizontal: 20,
                              width: '90%',
                              color: '#7f7f7f',
                            }}
                            onChangeText={(val) => this.onChangeText("firstName", val)}
                          />
                          <Icon
                            name="edit"
                            color="#7f7f7f"
                            size={20}
                            style={{ position: 'absolute', top: 13, right: 15 }}
                          />
                        </Box>
                        <Box
                          height={50}
                          width={300}
                          borderRadius={25}
                          style={{ alignSelf: 'center' }}
                          styleChildren={{ justifyContent: 'center' }}
                        >
                          <TextInput
                            placeholder="Last Name"
                            defaultValue={this.state.lastName}
                            placeholderTextColor="#B5BFD0"
                            style={{
                              fontWeight: 'bold',
                              paddingHorizontal: 20,
                              width: '90%',
                              color: '#7f7f7f',
                            }}
                            onChangeText={(val) => this.onChangeText("lastName", val)}
                          
                          />
                          <Icon
                            name="edit"
                            color="#7f7f7f"
                            size={20}
                            style={{ position: 'absolute', top: 13, right: 15 }}
                          />
                        </Box>
                        <Box
                          height={70}
                          width={300}
                          borderRadius={25}
                          style={{ alignSelf: 'center', marginLeft: 10 }}>
                          <TextInput
                            placeholder="About Me. eg: Hi! I am Adam and I'm from California."
                            multiline={true}
                            defaultValue={this.state.bio}
                            numberOfLines={3}
                            textAlignVertical="top"
                            style={{
                              fontWeight: 'bold',
                              paddingHorizontal: 20,
                              width: '90%',
                              color: '#7f7f7f',
                              paddingTop: 15,
                            }}
                            onChangeText={(val) => this.onChangeText("bio", val)}
                          
                          />
                          <Icon
                            name="edit"
                            color="#7f7f7f"
                            size={20}
                            style={{ position: 'absolute', top: 13, right: 15 }}
                          />
                        </Box>
                        <LinearGradient
                          start={{ x: 0, y: 0 }}
                          end={{ x: 1, y: 0 }}
                          colors={['#3a7bd5', '#00d2ff']}
                          style={{
                            height: 50,
                            borderRadius: 25,
                            width: 300,
                            alignSelf: 'center',
                            marginTop: 10,
                          }}>
                          <TouchableOpacity
                            style={{
                              alignItems: 'center',
                              justifyContent: 'center',
                              backgroundColor: 'transparent',
                              height: 50,
                              width: 300,
                            }}
                            onPress={() => this.doneFunction()}>
                            <Text
                              style={{ color: '#fff', fontWeight: 'bold', fontSize: 12 }}>
                              DONE
                          </Text>
                          </TouchableOpacity>
                        </LinearGradient>
                        <Text
                          style={{
                            color: 'rgba(0,0,0,0.3)',
                            fontWeight: 'bold',
                            fontSize: 12,
                            alignSelf: 'center',
                            marginTop: 10,
                            paddingBottom: 20
                          }}>
                          Looking for a place to
                        <Text
                            style={{
                              color: '#3a7bd5',
                              fontWeight: 'bold',
                              fontSize: 12,
                            }}
                            onPress={() => this.logOutFunction()}>
                            {' '}
                          Log Out?
                        </Text>
                        </Text>
                      </View>
                    </View>
            </TouchableWithoutFeedback>
          </KeyboardAwareScrollView>
          </ScrollView>
        {/* <KeyboardAvoidingView behavior="position"> */}
        {/* <View
            style={{
              width: '100%',
              bottom: this.state.keyboardOn ? -500 : -20,
              position: 'absolute',
            }}>
            <Image
              source={require('../assets/group.png')}
              style={{ width: '100%', zIndex: -1 }}
            />
          </View> */}

        {/* </KeyboardAvoidingView> */}
        {/* <View style={{ flex: 1 }}>
          <Video
            source={require('../assets/loader3.mp4')}
            repeat={true}
            style={{ width: "100%", height: '100%', alignSelf: 'center', marginTop: 20 }}
            resizeMode='contain'
          />
        </View> */}
      </SafeAreaView>
    );
  }
}

const mapStateToProps = state => {
  return ({
    user: state.user
  })
}

export default connect(mapStateToProps)(openingScreen)