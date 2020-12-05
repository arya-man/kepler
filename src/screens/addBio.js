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

class openingScreen extends Component {
  constructor(props) {
    super(props);
    this.state = {
      keyboardOn: false,
      photoUrl: "https://source.unsplash.com/random",
      photoUrlBase64: '',
      firstName: '',
      lastName: '',
      bio: '',
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
      this.setState({
        fieldMessage: 'Please Fill all the Fields',
        fieldmodalVisible: true
      })
      return
    }
    this.setState({ isLoading: true })
    const ref = storage().ref(this.state.username.toLowerCase() + '/dp.png');
    // await ref.putFile(this.state.photoUrl);
    // var url = await ref.getDownloadURL();
    firestore()
      .collection('Users')
      .doc(this.state.username.toLowerCase())
      .update({
        firstName: this.state.firstName,
        lastName: this.state.lastName,
        bio: this.state.bio,
        photoUrl: "https://source.unsplash.com/random",
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
            photoUrl: "https://source.unsplash.com/random",
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
          <ActivityIndicator size="large" color="#4e7bb4" />
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
                          photoUrl: Platform.OS === 'ios' ? image.replace('file://', '') : image['path'],
                          mime: image['mime']
                        })
                      })
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
                    source={require('../assets/placeholder.jpg')}
                    style={{
                      height: 100,
                      width: 100,
                      borderRadius: 15,
                      // resizeMode: "contain",
                    }}
                  />
                  <Text
                    style={{
                      position: "absolute",
                      bottom: 0,
                      fontSize: 11,
                      alignSelf: "center",
                      color: "#fff",
                      fontWeight: "bold",
                      backgroundColor: "#4e7bb4",
                      paddingHorizontal: '40%',
                      paddingVertical: 1,
                      width:'100%'
                    }}
                  >
                    Edit
              </Text>
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
                      photoUrl: Platform.OS === 'ios' ? image.replace('file://', '') : image['path'],
                      mime: image['mime']
                    })
                  } catch (error) {
                    this.setState({ authMessage: error })
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
                  styleChildren={{ justifyContent: 'center'}}
                >
                  <TextInput
                    placeholder="First Name"
                    placeholderColor="#B5BFD0"
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
                  styleChildren={{ justifyContent: 'center'}}  
                >
                  <View style={{ flexDirection: "row", alignItems: "center" }}>
                    <TextInput
                      placeholder="Last Name"
                      placeholderColor="#B5BFD0"
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
                  styleChildren={{ justifyContent: 'center'}}
                >
                  <View style={{ flexDirection: "row", alignItems: "center" }}>
                    <TextInput
                      placeholder="Bio. eg: El Psy Congroo (ﾉ◕ヮ◕)."
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
                  colors={["#EA688A", "#EA7A7F"]}
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
          <View style={{flex: 1}}>
              <Video
              source={require('../assets/loader3.mp4')}
              repeat={true}
              style={{ width: "100%", height: '100%', alignSelf: 'center' , marginTop: 20}}
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