'use client';

import { Playground, Header, Footer, Banner } from '../../components';

export default function PlaygroundPage() {
  return (
    <>
      <Header onOpenConfig={() => {}} />
      <Banner />
      <Playground />
      <Footer />
    </>
  );
}
