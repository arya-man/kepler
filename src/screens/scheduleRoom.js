import React, { Component } from 'react';
import { Text, SafeAreaView, TouchableOpacity, View, Dimensions, Modal, TextInput, Image} from 'react-native';
import Box from '../screens/neumorphButton';
import Feather from 'react-native-vector-icons/Feather';
import {CreateRoomButton, UpcomingRoom} from './audioRoomHome';
import DateTimePicker from '@react-native-community/datetimepicker';
import moment from 'moment';
import RNFetchBlob from 'rn-fetch-blob';
import Share from 'react-native-share';
import dynamicLinks from '@react-native-firebase/dynamic-links';

const screenWidth = Dimensions.get('window').width;

export default class scheduleRoom extends Component {
  constructor(props) {
    super(props);
    this.state = {
      scheduleRoomModalVisible: false,
      showDateTimePicker: false,
      dateTimeMode: 'date',
      active: false,
      dateTimeValue: new Date(), // This will contain the final Date/Time, use moment to acces individuallly.
      title: "",  //This will contain the final title after entering.
      description: "",  //This will contain the final description after entering.
      nothingScheduledYet: false
    };
  }
  onChange = (event, selectedDate) => {
    const currentDate = selectedDate || this.state.dateTimeValue;
    this.setState({ showDateTimePicker: Platform.OS === 'ios' });
    this.setState({ dateTimeValue: currentDate, active: true });
  };
  showDate = () => {
      this.setState({ dateTimeMode: 'date' });
      this.setState({ showDateTimePicker: true });
  };
  showTime = () => {
      this.setState({ dateTimeMode: 'time' });
      this.setState({ showDateTimePicker: true });
  };

  deeplink = async(id) => {
    const link = await dynamicLinks().buildLink({
    link: 'https://keplr.org/'+id,
    // domainUriPrefix is created in your Firebase console
    domainUriPrefix: 'https://keplr.page.link',
    android: {
      packageName: 'com.keplr',
    },
    ios:{
      bundleId:'com.keplrapp'
    }
  });
  console.log(link);
  return link;

}
  onShareFunction = async () => {
    let shareLink = await this.deeplink(this.props.navigation.getParam('roomId'));
    this.setState({shareLoading: true})
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
      this.setState({shareLoading: false})
    });
    this.setState({shareLoading: false})
    // ------------------------------------------------------
    // console.log("share share");
  }
  render() {
    return (
      <SafeAreaView style={{flex: 1,backgroundColor: 'rgb(233, 235, 244)'}}>
        <BackButtonAndTitle navigation={this.props.navigation} title="Scheduled Rooms"/>
        {this.state.nothingScheduledYet ? (
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
              source={require('../../Assets/noRooms.png')}
            />
            <Text
              style={{
                alignSelf: 'center',
                color: '#7f7f7f',
                fontSize: 17,
                marginTop: 10,
                textAlign: 'center'
              }}>
                <Text style={{fontWeight: 'bold'}}>No rooms scheduled yet.</Text>
                  {`\n`}Schedule a room and {`\n`}let the fun begin.
              </Text>
          </View>
        ) : (
              <UpcomingRoom
                hashtag="Really Good Time on Keplr"
                caption="Join Hasir Mushtaq, Aryaman Shrey and Aditya Kumar taking on Modi Ji, and all the Bhakts in a once in a lifetime opportunity to get your queries answered in person."
                profilePic="https://source.unsplash.com/random"
                username="Hasir Mushtaq" //Here display full name, not username plz.
                date="October 13, 2021"
                time="10:00 a.m. IST"
                startNow={true}
                startNowFunction={()=>{
                  console.log('hello');
                }}
                shareFunction={this.onShareFunction}
              />
        )}
        <ScheduleRoomPopUp
          scheduleRoomModalVisible={this.state.scheduleRoomModalVisible}
          active={this.state.active}
          onChangeTitle={(text) => {
            this.setState({title: text})
          }}
          onChangeDescription={(text) => {
            this.setState({description: text})
          }}
          date={moment(this.state.dateTimeValue).format('MMMM Do YYYY, dddd')}
          onPressDate={()=>{
            this.showDate();
            console.log('date');
          }}
          time={moment(this.state.dateTimeValue).format('h:mm A')}
          onPressTime={()=>{
            this.showTime();
            console.log('time');
          }}
          toggleScheduleRoomModal={()=>{
            this.setState({scheduleRoomModalVisible: false, active: false})
          }}
        />
        {this.state.showDateTimePicker && (
          <DateTimePicker
            testID="dateTimePicker"
            value={this.state.dateTimeValue}
            mode={this.state.dateTimeMode}
            is24Hour={false}
            display="default"
            onChange={this.onChange}
          />
        )}
        <BottomBar
          name="SCHEDULE NEW ROOM"
          onPress={()=>{
            this.setState({scheduleRoomModalVisible: true})
          }}
        />
      </SafeAreaView>
    )
  }
}
class BottomBar extends Component {
  render() {
    return(
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
            width={screenWidth*0.8}
            text={this.props.name}
            borderRadius={20}
            createRoom={this.props.onPress}
          />
      </View>
    );
  }
}
export class BackButtonAndTitle extends Component {
  render(){
    return(
      <View 
        style={{
          flexDirection:'row', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          paddingBottom: 15,
          marginHorizontal: 15,
          borderBottomColor: 'rgba(191,191,191,0.3)',
          borderBottomWidth: 2,
          borderRadius: 2,
        }}>
          <TouchableOpacity
            style={{marginTop: 5 }}
            onPress={() => this.props.navigation.goBack()}>
            <Box height={50} width={50} borderRadius={10}>
              <Feather
                name="chevron-left"
                color="#B5BFD0"
                size={40}
                style={{ alignSelf: 'center', marginTop: 5 }}
              />
            </Box>
          </TouchableOpacity>
          <Text 
            style={{
              color: '#3a7bd5',
              fontSize: 30,
              fontWeight: 'bold',
            }}>
            {this.props.title}
          </Text>
      </View>
    );
  }
}
class ScheduleRoomPopUp extends Component {
  render() {
    return(
      <Modal
          animationType='fade'
          transparent={true}
          visible={this.props.scheduleRoomModalVisible}
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
                  Schedule a Room
                </Text>
                <Feather
                  name="x-circle"
                  style={{ color: '#3a7bd5' }}
                  size={25}
                  onPress={this.props.toggleScheduleRoomModal}
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
                  color="#343434"
                  style={{
                    fontWeight: 'bold',
                    paddingHorizontal: 20,
                    width: '100%',
                  }}
                  onChangeText={this.props.onChangeTitle}
                />
              </Box>
              <Box
                height={40}
                width={275}
                borderRadius={20}
                style={{ alignSelf: 'center'}}>
                <TextInput
                  placeholder="Description"
                  placeholderTextColor="#B5BFD0"
                  color="#343434"
                  style={{
                    fontWeight: 'bold',
                    paddingHorizontal: 20,
                    width: '100%',
                  }}
                  onChangeText={this.props.onChangeDescription}
                />
              </Box>
              <TouchableOpacity onPress={this.props.onPressDate}>
                <Box
                  height={40}
                  width={275}
                  borderRadius={20}
                  style={{ alignSelf: 'center' }}
                  styleChildren={{ justifyContent: 'center' }}
                >
                   <Text 
                    style={{
                      fontWeight: 'bold',
                      paddingHorizontal: 20,
                      width: '100%',
                      color: this.props.active ? '#343434': '#B5BFD0'
                    }}>
                    {this.props.active ? this.props.date : "Date"}
                  </Text>
                  <Feather
                    name="calendar"
                    style={{ color: '#B5BFD0', position: 'absolute', top: 10, right: 15}}
                    size={20}
                  />
                </Box>
              </TouchableOpacity>
              <TouchableOpacity onPress={this.props.onPressTime}>
                <Box
                  height={40}
                  width={275}
                  borderRadius={20}
                  style={{ alignSelf: 'center' }}
                  styleChildren={{ justifyContent: 'center' }}
                >
                  <Text 
                    style={{
                      fontWeight: 'bold',
                      paddingHorizontal: 20,
                      width: '100%',
                      color: this.props.active ? '#343434': '#B5BFD0'
                    }}>
                    {this.props.active ? this.props.time : "Time"}
                  </Text>
                  <Feather
                    name="clock"
                    style={{ color: '#B5BFD0', position: 'absolute', top: 10, right: 15}}
                    size={20}
                  />
                </Box>
              </TouchableOpacity>
              <View style={{ alignSelf: 'center', marginTop: 10, marginBottom: 15 }}>
                <CreateRoomButton
                  height={40}
                  width={0.65 * screenWidth}
                  // loading={this.state.createLoading}
                  borderRadius={20}
                  text="DONE"
                  createRoom={() => {
                  }}
                />
              </View>
            </View>
          </View>
        </Modal>
    );
  }
}