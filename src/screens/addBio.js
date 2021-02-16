import React, { Component } from "react";
import {
  Text,
  View,
  Image,
  TextInput,
  TouchableWithoutFeedback,
  Keyboard,
  TouchableOpacity,
  ActivityIndicator,
  Dimensions,
  Platform,
  SafeAreaView,
} from "react-native";
import LinearGradient from "react-native-linear-gradient";
import Box from '../screens/neumorphButton';
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
import ImagePicker from 'react-native-image-crop-picker'
import firestore from "@react-native-firebase/firestore"
import storage from "@react-native-firebase/storage"
import AsyncStorage from "@react-native-async-storage/async-storage"
import ErrorPopup from './errorPopup'
import { connect } from 'react-redux'
import { GET_USER } from '../redux/userRedux'
import Video from 'react-native-video'

const screenHeight = Dimensions.get('window').height
const screenWidth = Dimensions.get('window').width
import LottieView from 'lottie-react-native'

class openingScreen extends Component {
  constructor(props) {
    super(props);
    this.state = {
      keyboardOn: false,
      photoUrl: 'https://firebasestorage.googleapis.com/v0/b/keplr-4ff01.appspot.com/o/rocket.png?alt=media&token=48594f77-8e8c-4061-8725-580162101f90',
      photoUrlBase64: '',
      firstName: 'anon',
      lastName: 'anon',
      bio: 'anon',
      username: this.props.navigation.getParam('username'),
      mime: '',
      isLoading: false,
      fieldmodalVisible: false,
      authmodalVisible: false,
      fieldMessage: '',
      authMessage: '',
    };
    this.onChangeText = this.onChangeText.bind(this)
    this.addUserDetails = this.addUserDetails.bind(this)
    this.imageNot
  }

  componentDidUpdate(prevProps, prevState) {
    if (this.state.authMessage !== prevState.authMessage && this.state.authMessage !== '') {
      this.setState({ authmodalVisible: true })
    }

    else if (this.state.fieldMessage !== prevState.fieldMessage && this.state.fieldMessage !== '') {
      this.setState({ fieldmodalVisible: true })
    }
  }

  onChangeText = (key, val) => {
    this.setState({ [key]: val });
  };
  addUserDetails = async () => {
    if (this.state.photoUrl === undefined) {
      this.setState({ fieldMessage: 'Choose Image By Clicking on the Top Right Icon to Proceed' })
      return
    }
    if (this.state.firstName == '' || this.state.lastName == '' || this.state.bio == '') {
      if (this.state.firstName == '') {
        this.setState({
          firstName: 'Anon'
        })
      }
      if (this.state.lastName == '') {
        this.setState({
          lastName: 'Anon'
        })
      }
      if (this.state.bio == '') {
        this.setState({
          bio: 'Hello World, I am enjoying Keplr'
        })
      }
      // this.setState({
      //   fieldMessage: 'Please Fill all the Fields',
      //   fieldmodalVisible: true
      // })
      // return
    }
    this.setState({ isLoading: true })
    var url;
    //data:image/jpeg;base64,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
    if (this.state.photoUrl !== 'https://firebasestorage.googleapis.com/v0/b/keplr-4ff01.appspot.com/o/rocket.png?alt=media&token=48594f77-8e8c-4061-8725-580162101f90') {
      const ref = storage().ref(this.state.username.toLowerCase() + '/dp.png');
      await ref.putFile(this.state.photoUrl);
      url = await ref.getDownloadURL();
    }
    else {
      url = 'https://firebasestorage.googleapis.com/v0/b/keplr-4ff01.appspot.com/o/rocket.png?alt=media&token=095b92d1-cc86-4d60-8940-cb17bac0213d'
    }
    firestore()
      .collection('Users')
      .doc(this.state.username.toLowerCase())
      .update({
        firstName: this.state.firstName,
        lastName: this.state.lastName,
        bio: this.state.bio,
        photoUrl: url,
        joinTime:new Date(),
        followers:0,
        following:0
      })
      .then(() => {
        firestore()
          .collection("Users")
          .doc(this.state.username.toLowerCase())
          .get()
          .then(function (user) {
            // console.log(user)
            AsyncStorage.setItem('data', JSON.stringify(user['_data']))
          }.bind(this))
          .catch(function (error) {
            const { code, message } = error;
            this.setState({ authMessage: message })
          });
        this.props.dispatch({
          type: GET_USER,
          payload: {
            firstName: this.state.firstName,
            lastName: this.state.lastName,
            bio: this.state.bio,
            photoUrl: url,
            username: this.props.navigation.getParam('username'),
            uid: this.props.navigation.getParam('uid'),
            email: this.props.navigation.getParam('email'),
          }
        })
        AsyncStorage.setItem('bioDone', 'done').catch()
        this.props.navigation.navigate("openingScreen")
        // console.log('User updated!');
      })
      .catch((error) => {
        // handle failure
        // console.log(error)
        this.setState({ isLoading: true })
        this.setState({ authMessage: `Error: ${error.code} | ${error.description}` })
      });
  }
  render() {
    if (this.state.isLoading === true) {
      return (
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
          Hold on...Loading
        </Text>
      </View>
        </View>
      )
    } else {


      return (
        <SafeAreaView style={{ height: screenHeight, backgroundColor: "rgb(233, 235, 244)" }}>
          <View>
            <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
              <ErrorPopup
                title="Cannot Proceed"
                subTitle={this.state.fieldMessage}
                okButtonText="OK"
                clickFunction={() => {
                  this.setState({ fieldMessage: '' })
                  this.setState({ fieldmodalVisible: !this.state.fieldmodalVisible }); //Always keep this thing here
                }}
                modalVisible={this.state.fieldmodalVisible}
              />

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

              {this.state.photoUrl === undefined &&
                <TouchableOpacity
                  onPress={() => {
                    try {
                      ImagePicker.openPicker({
                        height: 500,
                        width: 500,
                        cropping: true
                      })
                        .then((image) => {
                          this.setState({
                            photoUrl: Platform.OS === 'ios' ? image['path'].replace('file://', '') : image['path'],
                            mime: image['mime']
                          })
                        })
                        .catch(() => { })
                      // console.log(this.state)
                    } catch (error) {
                      this.imageNot = error
                      // this.setState({ authMessage: error })
                    }
                  }}
                >
                  <Box
                    height={102}
                    width={102}
                    borderRadius={16}
                    style={{ alignSelf: "center" }}
                  >
                    <Image
                      source={{ uri: this.state.photoUrl }}
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
              }
              {this.state.photoUrl !== undefined &&
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
                      })
                    } catch (error) {
                      this.setState({ authMessage: "Image Selection Cancelled" })
                    }
                  }}
                >
                  <Box
                    height={102}
                    width={102}
                    borderRadius={16}
                    style={{ alignSelf: "center" }}
                  >
                    <Image
                      source={{ uri: this.state.photoUrl }}
                      style={{
                        height: 100,
                        width: 100,
                        borderRadius: 15,
                        // resizeMode: "contain",
                      }}
                    />
                  </Box>
                </TouchableOpacity>
              }
            </View>
            {/* <KeyboardAvoidingView behavior="padding"> */}
            <KeyboardAwareScrollView>
              <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
                <View style={{ marginTop: 20 }}>
                  <Box
                    height={50}
                    width={300}
                    borderRadius={25}
                    style={{ alignSelf: "center" }}
                    styleChildren={{ justifyContent: 'center' }}
                  >
                    <TextInput
                      placeholder="First Name"
                      placeholderTextColor="#B5BFD0"
                      style={{
                        fontWeight: "bold",
                        paddingHorizontal: 20,
                        width: "100%",
                      }}
                      onChangeText={(val) => this.onChangeText("firstName", val)}
                    />
                  </Box>
                  <Box
                    height={50}
                    width={300}
                    borderRadius={25}
                    style={{ alignSelf: "center" }}
                    styleChildren={{ justifyContent: 'center' }}
                  >
                    <View style={{ flexDirection: "row", alignItems: "center" }}>
                      <TextInput
                        placeholder="Last Name"
                        placeholderTextColor="#B5BFD0"
                        style={{
                          fontWeight: "bold",
                          paddingHorizontal: 20,
                          width: 260,
                        }}
                        onChangeText={(val) => this.onChangeText("lastName", val)}

                      />
                    </View>
                  </Box>
                  <Box
                    height={70}
                    width={300}
                    borderRadius={25}
                    style={{ alignSelf: "center", marginLeft: 10 }}
                    styleChildren={{ justifyContent: 'center' }}
                  >
                    <View style={{ flexDirection: "row", alignItems: "center" }}>
                      <TextInput
                        placeholder="Bio. eg: El Psy Congroo"
                        multiline={true}
                        numberOfLines={3}
                        textAlignVertical="top"
                        style={{
                          fontWeight: "bold",
                          paddingHorizontal: 20,
                          width: 260,
                        }}
                        onChangeText={(val) => this.onChangeText("bio", val)}
                      />
                    </View>
                  </Box>
                  <LinearGradient
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    colors={["#3a7bd5", "#00d2ff"]}
                    style={{
                      height: 50,
                      borderRadius: 25,
                      width: 300,
                      alignSelf: "center",
                      marginTop: 10,
                    }}
                  >
                    <TouchableOpacity
                      style={{
                        alignItems: "center",
                        justifyContent: "center",
                        backgroundColor: "transparent",
                        height: 50,
                        width: 300,
                      }}
                      onPress={() =>
                        this.addUserDetails()
                      }
                    >
                      <Text
                        style={{ color: "#fff", fontWeight: "bold", fontSize: 12 }}
                      >
                        NEXT
                  </Text>
                    </TouchableOpacity>
                  </LinearGradient>
                </View>
              </TouchableWithoutFeedback>
            </KeyboardAwareScrollView>
          </View>
          {/* <View
              style={{
                width: "100%",
                bottom: this.state.keyboardOn ? -500 : -20,
                position: "absolute",
              }}
            >
              <Image
                source={require("../assets/logo.png")}
                // style={{borderWidth: 1, borderColor: 'black'}}
                style={{ alignSelf: 'center', height: 100, width: 100, marginBottom: '10%' }}
              />
            </View> */}
          <View style={{ flex: 1 }}>
            <Video
              source={require('../assets/loader3.mp4')}
              repeat={true}
              style={{ width: "100%", height: '100%', alignSelf: 'center', marginTop: 20 }}
              resizeMode='contain'
            />
          </View>
        </SafeAreaView>
      );
    }
  }
}

const mapStateToProps = state => {
  return ({
    user: state.user
  })
}

export default connect(mapStateToProps)(openingScreen)