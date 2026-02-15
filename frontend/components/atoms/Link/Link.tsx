import React from 'react';
import { Text, Pressable } from 'react-native';
import { Link as ExpoLink } from 'expo-router';
import { styles } from '@/components/atoms/Link/Link.styles';

interface LinkProps {
  href: string;
  text: string;
  external?: boolean;
}

export default function Link({ href, text, external }: LinkProps) {
  if (external) {
    return (
      <Pressable onPress={() => {}}>
        <Text style={styles.link}>{text}</Text>
      </Pressable>
    );
  }

  return <ExpoLink href={href as any} style={styles.link}>{text}</ExpoLink>;
}
