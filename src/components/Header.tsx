import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS } from '../theme/colors';
import { useAuth } from '../context/AuthContext';
interface HeaderProps {title?:string;subtitle?:string;onRightPress?:()=>void;rightIconName?:keyof typeof MaterialCommunityIcons.glyphMap}
export const Header:React.FC<HeaderProps>=({title='Sadé',subtitle,onRightPress,rightIconName='account-outline'})=>{
 const {greetingName}=useAuth();return <View style={styles.header}><View style={styles.brand}><MaterialCommunityIcons name="flower-tulip-outline" size={26} color={COLORS.primary}/><Text style={styles.wordmark}>{title}</Text>{subtitle?<Text numberOfLines={1} style={styles.page}>{subtitle}</Text>:null}</View><TouchableOpacity accessibilityRole="button" accessibilityLabel="Open profile" onPress={onRightPress} style={styles.profile}><Text numberOfLines={1} style={styles.name}>{greetingName}</Text><View style={styles.avatar}><MaterialCommunityIcons name={rightIconName} size={19} color="#FFFFFF"/></View></TouchableOpacity></View>
};
const styles=StyleSheet.create({header:{height:68,flexShrink:0,paddingHorizontal:20,flexDirection:'row',alignItems:'center',justifyContent:'space-between',gap:8,backgroundColor:COLORS.background},brand:{flexShrink:1,flexDirection:'row',alignItems:'center',gap:5},wordmark:{fontFamily:'serif',fontStyle:'italic',fontSize:25,color:COLORS.primary},page:{flexShrink:1,fontFamily:'serif',fontSize:18,color:COLORS.primary,marginLeft:8},profile:{flexDirection:'row',alignItems:'center',gap:7,padding:5,paddingLeft:11,minHeight:44,borderRadius:24,backgroundColor:COLORS.surfaceContainerHigh,maxWidth:140},name:{fontSize:11,color:COLORS.onSurfaceVariant,maxWidth:78},avatar:{width:30,height:30,borderRadius:15,alignItems:'center',justifyContent:'center',backgroundColor:COLORS.primary}});
