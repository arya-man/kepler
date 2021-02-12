import React, { Component } from "react";
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
  SafeAreaView,
} from "react-native";
import LinearGradient from "react-native-linear-gradient";
import Box from '../screens/neumorphButton'
import Icon from "react-native-vector-icons/Feather";
import auth from "@react-native-firebase/auth";
import firestore from "@react-native-firebase/firestore";
import AsyncStorage from "@react-native-async-storage/async-storage";
import ErrorPopup from './errorPopup'
import { GET_USER } from '../redux/userRedux'
import { connect } from 'react-redux'
import Video from 'react-native-video'

const screenHeight = Dimensions.get('window').height
const screenWidth = Dimensions.get('window').width

class openingScreen extends Component {
  constructor(props) {
    super(props);
    this.state = {
      keyboardOn: false,
      icon: "eye-off",
      hidePassword: true,
      email: "",
      password: "",
      isLoading: false,
      fieldmodalVisible: false,
      authmodalVisible: false,
      authMessage: ''
    };

    this.onChangeText = this.onChangeText.bind(this);
    this.onPressLogin = this.onPressLogin.bind(this)
  }

  componentDidUpdate(prevProps, prevState) {
    if (this.state.authMessage !== prevState.authMessage && this.state.authMessage !== '') {
      this.setState({ authmodalVisible: true })
    }
  }

  _changeIcon = () => {
    this.state.icon !== "eye-off"
      ? this.setState({ icon: "eye-off", hidePassword: true })
      : this.setState({ icon: "eye", hidePassword: false });
  };

  onChangeText = (key, val) => {
    this.setState({ [key]: val });
  };

  // todo [Hasir]: handle how we display in case in failed login
  onPressLogin() {
    const { email, password } = this.state;
    if (email.length <= 0 || password.length <= 0) {
      this.setState({ fieldmodalVisible: true })
      return;
    }
    this.setState({ isLoading: true })
    auth()
      .signInWithEmailAndPassword(email, password)
      .then(response => {
        const user_uid = response.user._user.uid;
        // console.log(user_uid);
        AsyncStorage.setItem("userId", user_uid);
        firestore()
          .collection("Users")
          .where('email', '==', this.state.email.toLowerCase())
          .limit(1)
          .get()
          .then(user => {
            // console.log(user)
            user.forEach(async loggedIn => {
              // console.log(loggedIn)
              // console.log("LOGIN",loggedIn['_data'])

              var log = loggedIn['_data']
              // console.log("LOG",log['avatar'].toBase64())
              //log['photoUrl'] = await log['photoUrl']
              //delete log['avatar']

              this.props.dispatch({
                type: GET_USER,
                payload: log
              })
              await AsyncStorage.setItem('data', JSON.stringify(loggedIn["_data"]));
            })
            this.props.navigation.navigate("normal");
          })
          .catch(function (error) {
            const { code, message } = error;
            this.setState({ isLoading: false })
            this.setState({ authMessage: message })
          });
      })
      .catch(error => {
        const { code, message } = error;
        this.setState({ isLoading: false })
        this.setState({ authMessage: message })
      });
  };
  render() {
    if (this.state.isLoading === true) {
      return (
        <View style={{ flex: 1, justifyContent: "center" }}>
          <ActivityIndicator size="large" color="#4e7bb4" />
        </View>
      )
    }
    else {
      return (
        <SafeAreaView
          style={{
            height: screenHeight,
            backgroundColor: "rgb(233, 235, 244)",
            //   justifyContent: 'center',
          }}
        >

          <ErrorPopup
            title="Missing Fields"
            subTitle="Please fill out all the required fields"
            okButtonText="OK"
            clickFunction={() => {
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

          <KeyboardAvoidingView behavior="padding">
            <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
              <View style={{ marginTop: 120 }}>
                <Image
                  source={require('../../Assets/LogoName.png')}
                  style={{
                    height: 70,
                    width: '60%',
                    resizeMode: 'contain',
                    alignSelf: 'center',
                    marginBottom: 50,
                  }}
                />
                <Box
                  height={50}
                  width={300}
                  borderRadius={25}
                  style={{ alignSelf: "center" }}
                  styleChildren={{ justifyContent: 'center'}}
                >
                  <TextInput
                    placeholder="Email"
                    placeholderTextColor="#B5BFD0"
                    style={{
                      fontWeight: "bold",
                      paddingHorizontal: 20,
                      width: "100%",
                    }}
                    onChangeText={(val) => this.onChangeText("email", val)}
                  />
                </Box>
                <Box
                  height={50}
                  width={300}
                  borderRadius={25}
                  style={{ alignSelf: "center" }}
                  styleChildren={{ justifyContent: 'center'}}
                >
                  <View style={{ flexDirection: "row", alignItems: "center", justifyContent: 'center' }}>
                    <TextInput
                      placeholder="Password"
                      placeholderTextColor="#B5BFD0"
                      secureTextEntry={this.state.hidePassword}
                      style={{
                        fontWeight: "bold",
                        paddingHorizontal: 20,
                        width: 260,
                      }}
                      onChangeText={(val) => this.onChangeText("password", val)}
                    />
                    <Icon
                      name={this.state.icon}
                      size={20}
                      color="#B5BFD0"
                      onPress={() => this._changeIcon()}
                      style = {{
                        marginRight: 10
                      }}
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
                    onPress={() => { this.onPressLogin() }}
                  >
                    <Text
                      style={{ color: "#fff", fontWeight: "bold", fontSize: 12 }}
                    >
                      LOG IN
                  </Text>
                  </TouchableOpacity>
                </LinearGradient>
                <View style={{ alignSelf: "center", flexDirection: "row" }}>
                  <TouchableOpacity
                    onPress={() =>
                      this.props.navigation.navigate("forgotPassword")
                    }
                  >
                    <Text
                      style={{
                        color: "#a9b6c8",
                        marginTop: 10,
                        //   textAlign: 'center',
                        textDecorationLine: "underline",
                        fontWeight: "bold",
                      }}
                    >
                      Forgot Password?
                  </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => this.props.navigation.navigate("signUp")}
                  >
                    <Text
                      style={{
                        color: "#6C90C4",
                        marginTop: 10,
                        textAlign: "center",
                        marginLeft: 10,
                        fontWeight: "bold",
                      }}
                    >
                      Sign Up!
                  </Text>
                  </TouchableOpacity>
                </View>
              </View>
            </TouchableWithoutFeedback>
          </KeyboardAvoidingView>
          {/* <View
              style={{
                width: "100%",
                bottom: 100,
                // marginTop: "15%",
                position: "absolute",
              }}
            > */}
          {/* <Image
                source={require("../assets/logo.png")}
                // style={{borderWidth: 1, borderColor: 'black'}}
                style={{alignSelf:'center', height: 100, width: 100, marginBottom: '10%'}}
              /> */}
          {/* <Video
                source={require('../assets/loader.mp4')}
                style={{width:'100%', height: 300}}
                repeat={true}
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