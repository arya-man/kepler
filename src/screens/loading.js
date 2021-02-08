import React, { Component } from 'react'
import { Image } from 'react-native'
import auth from '@react-native-firebase/auth'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { DEEP_LINK } from '../redux/roomsRedux'
import { connect } from 'react-redux'
import dynamicLinks from '@react-native-firebase/dynamic-links';
var unsubscribe
class Loading extends Component {

    componentDidMount() {
        this.handleDynamicsLink();
        unsubscribe = auth().onAuthStateChanged(async user => {
            if (user === null) {
                this.props.navigation.navigate('auth')
            }
            else {

                var bioDone = await AsyncStorage.getItem('bioDone')
                console.log("BIODONE", bioDone)
                if(bioDone === 'done') {
                    this.props.navigation.navigate('openingScreen')
                }
                else {
                    var data = await AsyncStorage.getItem('data')
                    console.log("DATA", data)
                    data = await JSON.parse(data)
                    if(data === null){
                        this.props.navigation.navigate('auth');
                    }
                    else{
                        this.props.navigation.navigate('addBio', data)
                    }
                }
            }
        })
    }
    handleDynamicsLink(){
        dynamicLinks()
        .getInitialLink()
        .then(link => {
        if (link) {
          this.handleDeepLink(link)
        }
      })
      .catch(error => {
        //console.log(error)
      })
    }
    handleDeepLink(link) {
        if (link.url.includes("https://keplr.page.link")) {
            var id = link.url.slice(link.url.lastIndexOf('/') + 1);
            this.props.dispatch({
                type: DEEP_LINK,
                payload: id
            })
        } else {
            this.props.dispatch({
                type: DEEP_LINK,
                payload: 0
            })
        }
      }


    componentWillUnmount() {
        unsubscribe()
    }

    render() {
        return (
            <Image source={require('../../Assets/launch_screen.png')} />
        )
    }

}

const mapStateToProps = state => {
    return ({
      room: state.room
    })
  }
  
export default connect(mapStateToProps)(Loading)