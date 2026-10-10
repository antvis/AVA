'use client'

import { Playground, Header, Footer } from '../../components';

export default function PlaygroundPage() {
  return (
    <>
      <Header onOpenConfig={() => {}} />
      <Playground />
      <Footer />
    </>
  );
}
