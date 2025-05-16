import React from 'react';
import FeatureItem from '../FeatureItem';

const featureList = [
  {
    title: 'Podcast',
    Svg: require('@site/static/img/mic_icon.svg').default,
    description: 'Apresentamos um podcast que aborda temas essenciais do mundo da tecnologia, sempre com convidados especiais.',
  },
  {
    title: 'Comunidade',
    Svg: require('@site/static/img/mic_discord.svg').default,
    description: 'Apresentamos um podcast que aborda temas essenciais do mundo da tecnologia, sempre com convidados especiais.',
  },
  {
    title: 'Notícias',
    Svg: require('@site/static/img/mic_megaphone.svg').default,
    description: 'Fique atualizado, dev! Junte-se a nós para se manter sempre atualizado com as mais recentes notícias de tecnologia.',
  },
];

function FeatureList() {
  return (
    <div className="row">
      {featureList.map((feature, idx) => (
        <FeatureItem key={idx} {...feature} />
      ))}
    </div>
  );
}

export default FeatureList;