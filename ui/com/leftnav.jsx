'use babel'
import React from 'react'
import { Link } from 'react-router'
import { rainbowSplitter } from 'patchkit-rainbow-text'
import LocalStoragePersistedComponent from 'patchkit-ls-persisted'
import ChannelList from 'patchkit-channel-list'
import Issues from './issues'
import app from '../lib/app'
import u from 'patchkit-util'
import LanguageMenu from './langmenu'
import t from 'patchwork-translations'

class LinkGroup extends LocalStoragePersistedComponent {
  constructor(props) {
    super(props, 'linkgroup-'+props.group, {
      isExpanded: true
    })
  }
  render() {
    const b = this.state.isExpanded
    const toggle = e => { e.preventDefault(); e.stopPropagation(); this.setState({ isExpanded: !b }) }
    return <div>
      <LeftNav.Link pathname={this.props.pathname} to={this.props.to} expander expanded={b} onToggleExpand={toggle}>
        {this.props.icon ? <i className={'fa fa-'+this.props.icon} /> : ''}
        {this.props.label}
      </LeftNav.Link>
      { b ? <div className="sublinks">{ this.props.children }</div> : '' }
    </div>
  }
}

export default class LeftNav extends React.Component {
  constructor(props) {
    super(props)
    this.state = {
      indexCounts: app.indexCounts,
      channels: app.channels || [],
      isChannelListOpen: false
    }

    // watch for updates to global state
    this.refresh = () => {
      this.setState({ channels: app.channels, indexCounts: app.indexCounts })
    }
    app.on('update:channels', this.refresh)
    app.on('update:indexCounts', this.refresh)

    // close channel popup on click outside of it
    this.maybeCloseChannels = (e) => {
      if (!this.state.isChannelListOpen)
        return
      // is the click within the channel list?
      for (var el = e.target; el; el = el.parentNode) {
        if (el.classList && el.classList.contains('channel-list'))
          return // keep open
      }
      // close, this was a click out of the channel list
      this.setState({ isChannelListOpen: false })
    }
    document.addEventListener('click', this.maybeCloseChannels)
  }
  componentWillUnmount() {
    app.removeListener('update:channels', this.refresh)
    app.removeListener('update:indexCounts', this.refresh)
    document.removeEventListener('click', this.maybeCloseChannels)
  }

  onOpenChannelList(e) {
    this.setState({ isChannelListOpen: true })
    e.nativeEvent.stopImmediatePropagation()
  }
  onSelectChannel(channel) {
    this.setState({ isChannelListOpen: false })
    app.history.pushState(null, '/channel/' + encodeURIComponent(channel.name))
  }

  static Heading (props) {
    return <div className="heading">{props.children}</div>
  }
  static Link (props) {
    return <div className={'link '+(props.className||'')+(props.pathname === props.to ? ' selected' : '')}>
      { props.expander ? <i className={`expander fa fa-caret-${(props.expanded?'down':'right')}`} onClick={props.onToggleExpand} /> : '' }
      <Link to={props.to}>{props.children}</Link>
    </div>
  }

  render() {
    const pathname = this.props.location && this.props.location.pathname

    // predicates
    const isPinned = b => channel => (!!channel.pinned == b)
    
    // lists
    const pinnedChannels = this.state.channels.filter(isPinned(true)).sort((a, b) => a.name.localeCompare(b.name))
    const contacts = app.user.friends.map(id => ({ id: id, name: u.getName(app.users, id) })).sort((a, b) => a.name.localeCompare(b.name))

    // render
    const renderChannel = c => <LeftNav.Link pathname={pathname} key={c.name} to={'/channel/'+c.name}># {c.name}</LeftNav.Link>
    const renderContact = c => <LeftNav.Link pathname={pathname} key={c.id} to={'/profile/'+encodeURIComponent(c.id)}>{c.name}</LeftNav.Link>
    return <div className="leftnav">
      <div className="logo"><Link to="/">{rainbowSplitter(t('Patchwork'))}</Link></div>

      <Issues/>
      { this.state.isChannelListOpen ? <ChannelList channels={this.state.channels} onSelect={this.onSelectChannel.bind(this)} /> : '' }
      
      <LinkGroup pathname={pathname} to="/inbox" label={<strong>{t('Inbox')} ({app.indexCounts.inboxUnread})</strong>} icon="comments" group="inbox">
        <LeftNav.Link pathname={pathname} to="/inbox/private">{t('Private')} ({app.indexCounts.privateUnread})</LeftNav.Link>
        <LeftNav.Link pathname={pathname} to="/inbox/watching">{t('Watching')} ({app.indexCounts.bookmarkUnread})</LeftNav.Link>
        <LeftNav.Link pathname={pathname} to="/inbox/mentions">{t('Mentioned')} ({app.indexCounts.mentionUnread})</LeftNav.Link>
      </LinkGroup>

      <LinkGroup pathname={pathname} to="/" label={t('ActivityFeed')} icon="bank" group="activity">
        { pinnedChannels.map(renderChannel) }
        <div className="link">
          <a onClick={this.onOpenChannelList.bind(this)}><i className="fa fa-search"/></a>
          { this.state.isChannelListOpen ? <i className="fa fa-caret-left" style={{ color: 'gray', marginLeft: 5 }} /> : '' }
        </div>
      </LinkGroup>

      <LinkGroup pathname={pathname} to="/contacts" label={t('Tribe')} icon="users" group="contacts">
        { contacts.map(renderContact) }
      </LinkGroup>

      <hr/>
      <LeftNav.Link className="thin" pathname={pathname} to={`/profile/${encodeURIComponent(app.user.id)}`}>{t('YourProfile')}</LeftNav.Link>
      <LeftNav.Link className="thin" pathname={pathname} to="/sync">{t('NetworkSync')}</LeftNav.Link>
      <LeftNav.Link className="thin" pathname={pathname} to="/data">{t('DataFeed')}</LeftNav.Link>
      
      <LanguageMenu/>
<LanguageMenu/>
    </div>
  }
}