import React from 'react';
import './index.less';

interface ContentPageProps {
  children: React.ReactNode;
}

class ContentPage extends React.Component<ContentPageProps, {}> {
  render() {
    return <div className="content-page">{this.props.children}</div>;
  }
}

export default ContentPage;
