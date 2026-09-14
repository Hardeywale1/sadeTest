import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
  ActivityIndicator,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { communityApi } from '../api/communityApi';
import { interestsApi } from '../api/profileApi';
import { toast } from '../components/Toast';
import { Post, Clan, Gossip, Comment, InterestCategory } from '../types';
import { COLORS } from '../theme/colors';

const relativeTime = (iso: string) => {
  const then = new Date(iso).getTime();
  if (!Number.isFinite(then)) return '';
  const minutes = Math.round((Date.now() - then) / 60_000);
  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.round(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(iso).toLocaleDateString();
};

const errorText = (error: any, fallback: string) => error?.response?.data?.error || fallback;

export const CommunityScreen: React.FC = () => {
  const [tab, setTab] = useState<'lounge' | 'clans' | 'gossip'>('lounge');
  const [posts, setPosts] = useState<Post[]>([]);
  const [clans, setClans] = useState<Clan[]>([]);
  const [gossips, setGossips] = useState<Gossip[]>([]);
  const [interestCatalog, setInterestCatalog] = useState<InterestCategory[]>([]);
  const [loading, setLoading] = useState(true);

  // Post composer
  const [createPostVisible, setCreatePostVisible] = useState(false);
  const [postTitle, setPostTitle] = useState('');
  const [postBody, setPostBody] = useState('');
  const [postInterests, setPostInterests] = useState<string[]>([]);
  const [postAnonymous, setPostAnonymous] = useState(false);
  const [posting, setPosting] = useState(false);
  const [postError, setPostError] = useState('');

  // Post detail / thread
  const [activePost, setActivePost] = useState<Post | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [commentsLoading, setCommentsLoading] = useState(false);
  const [replyBody, setReplyBody] = useState('');
  const [replying, setReplying] = useState(false);
  const [replyError, setReplyError] = useState('');
  const [likeBusyID, setLikeBusyID] = useState('');

  useEffect(() => {
    loadCommunityData();
  }, [tab]);

  useEffect(() => {
    Promise.all([interestsApi.getCatalog(), interestsApi.getSelection()])
      .then(([catalog, selected]) => {
        setInterestCatalog(catalog);
        setPostInterests(selected.length ? selected : catalog.slice(0, 1).map((item) => item.id));
      })
      .catch(() => undefined);
  }, []);

  const loadCommunityData = async () => {
    setLoading(true);
    try {
      if (tab === 'lounge') {
        const res = await communityApi.listPosts();
        setPosts(res.posts);
      } else if (tab === 'clans') {
        const res = await communityApi.listClans();
        setClans(res.clans);
      } else {
        const res = await communityApi.listGossips();
        setGossips(res.gossips);
      }
    } catch (e: any) {
      toast('Could not load the lounge', errorText(e, 'Check your connection and try again.'), 'error');
    } finally {
      setLoading(false);
    }
  };

  const openComposer = () => {
    setPostError('');
    setCreatePostVisible(true);
  };

  const handleCreatePost = async () => {
    if (!postTitle.trim() || !postBody.trim()) {
      // Shown in the modal itself: an Alert would be invisible on the web build.
      setPostError('Add both a title and a message before posting.');
      return;
    }
    setPostError('');
    setPosting(true);
    try {
      const created = await communityApi.createPost({
        title: postTitle.trim(),
        body: postBody.trim(),
        // Interests are optional: a failed catalog fetch must never block posting.
        interest_ids: postInterests,
        is_anonymous: postAnonymous,
      });
      setPosts((current) => [created, ...current]);
      setPostTitle('');
      setPostBody('');
      setPostAnonymous(false);
      setCreatePostVisible(false);
      toast('Posted to the lounge', 'Your thought is now live.', 'success');
    } catch (e: any) {
      setPostError(errorText(e, 'The lounge could not save your post. Please try again.'));
    } finally {
      setPosting(false);
    }
  };

  const openPost = async (post: Post) => {
    setActivePost(post);
    setComments([]);
    setReplyBody('');
    setReplyError('');
    setCommentsLoading(true);
    try {
      const res = await communityApi.listComments(post.id);
      setComments(res.comments);
    } catch (e: any) {
      setReplyError(errorText(e, 'Replies could not be loaded.'));
    } finally {
      setCommentsLoading(false);
    }
  };

  // Applies a server response for one post to both the feed and the open thread.
  const applyPostUpdate = (updated: Post) => {
    setPosts((current) => current.map((item) => (item.id === updated.id ? updated : item)));
    setActivePost((current) => (current && current.id === updated.id ? updated : current));
  };

  const toggleLike = async (post: Post) => {
    if (likeBusyID === post.id) return;
    setLikeBusyID(post.id);
    const liked = !!post.liked_by_me;
    // Optimistic: the heart responds immediately, then reconciles with the server.
    applyPostUpdate({
      ...post,
      liked_by_me: !liked,
      like_count: Math.max(0, (post.like_count || 0) + (liked ? -1 : 1)),
    });
    try {
      const updated = liked ? await communityApi.unlikePost(post.id) : await communityApi.likePost(post.id);
      applyPostUpdate(updated);
    } catch (e: any) {
      applyPostUpdate(post); // roll back to the pre-tap state
      toast('Could not update your like', errorText(e, 'Please try again.'), 'error');
    } finally {
      setLikeBusyID('');
    }
  };

  const handleReply = async () => {
    if (!activePost) return;
    if (!replyBody.trim()) {
      setReplyError('Write a reply before sending.');
      return;
    }
    setReplyError('');
    setReplying(true);
    try {
      const comment = await communityApi.addComment(activePost.id, replyBody.trim());
      setComments((current) => [...current, comment]);
      setReplyBody('');
      applyPostUpdate({ ...activePost, comment_count: (activePost.comment_count || 0) + 1 });
    } catch (e: any) {
      setReplyError(errorText(e, 'Your reply could not be sent. Please try again.'));
    } finally {
      setReplying(false);
    }
  };

  const handleJoinClan = async (clanId: string) => {
    try {
      await communityApi.joinClan(clanId);
      toast('Joined', 'You are now part of this clan.', 'success');
      loadCommunityData();
    } catch (e: any) {
      toast('Notice', errorText(e, 'You may already be a member of this clan.'));
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <Text style={styles.title}>The Sadé Lounge</Text>
          <Text style={styles.subtitle}>Connect with clans, shared wisdom &amp; daily chatter.</Text>
        </View>

        {/* Tab Selector */}
        <View style={styles.tabRow}>
          <TouchableOpacity
            style={[styles.tabBtn, tab === 'lounge' && styles.tabBtnActive]}
            onPress={() => setTab('lounge')}
          >
            <Text style={[styles.tabText, tab === 'lounge' && styles.tabTextActive]}>Lounge Posts</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tabBtn, tab === 'clans' && styles.tabBtnActive]}
            onPress={() => setTab('clans')}
          >
            <Text style={[styles.tabText, tab === 'clans' && styles.tabTextActive]}>Clans Roster</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tabBtn, tab === 'gossip' && styles.tabBtnActive]}
            onPress={() => setTab('gossip')}
          >
            <Text style={[styles.tabText, tab === 'gossip' && styles.tabTextActive]}>Tea &amp; Gossip</Text>
          </TouchableOpacity>
        </View>

        {loading ? <ActivityIndicator style={styles.loader} color={COLORS.primaryContainer} /> : null}

        {/* Tab 1: Lounge Posts */}
        {tab === 'lounge' && !loading && (
          <View>
            <TouchableOpacity style={styles.newPostBanner} onPress={openComposer}>
              <MaterialCommunityIcons name="pencil-outline" size={17} color={COLORS.primaryContainer} />
              <Text style={styles.newPostBannerText}>Share a thought with the lounge...</Text>
            </TouchableOpacity>

            {posts.length === 0 ? (
              <View style={styles.emptyBox}>
                <Text style={styles.emptyText}>No community posts yet. Be the first to share!</Text>
              </View>
            ) : (
              posts.map((p) => (
                <TouchableOpacity
                  key={p.id}
                  style={styles.postCard}
                  activeOpacity={0.85}
                  onPress={() => openPost(p)}
                  accessibilityRole="button"
                  accessibilityLabel={`Open post: ${p.title}`}
                >
                  <View style={styles.postHeader}>
                    <View style={styles.avatar}>
                      <Text style={styles.avatarText}>{(p.author_name || '?').charAt(0).toUpperCase()}</Text>
                    </View>
                    <View style={styles.postHeaderCopy}>
                      <Text style={styles.postAuthor}>{p.author_name || 'Sadé member'}</Text>
                      <Text style={styles.postTime}>{relativeTime(p.created_at)}</Text>
                    </View>
                  </View>
                  <Text style={styles.postTitle}>{p.title}</Text>
                  <Text style={styles.postBody} numberOfLines={3}>{p.body}</Text>
                  <View style={styles.postFooter}>
                    <TouchableOpacity
                      style={styles.actionBtn}
                      onPress={() => toggleLike(p)}
                      accessibilityRole="button"
                      accessibilityLabel={p.liked_by_me ? 'Unlike this post' : 'Like this post'}
                    >
                      <MaterialCommunityIcons
                        name={p.liked_by_me ? 'heart' : 'heart-outline'}
                        size={17}
                        color={p.liked_by_me ? COLORS.primaryContainer : COLORS.outline}
                      />
                      <Text style={[styles.actionText, p.liked_by_me && styles.actionTextActive]}>{p.like_count || 0}</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.actionBtn} onPress={() => openPost(p)} accessibilityRole="button" accessibilityLabel="Reply to this post">
                      <MaterialCommunityIcons name="comment-outline" size={16} color={COLORS.outline} />
                      <Text style={styles.actionText}>{p.comment_count || 0}</Text>
                    </TouchableOpacity>
                    <View style={styles.footerSpacer} />
                    <Text style={styles.openHint}>Open →</Text>
                  </View>
                </TouchableOpacity>
              ))
            )}
          </View>
        )}

        {/* Tab 2: Clans Roster */}
        {tab === 'clans' && !loading && (
          <View>
            {clans.length === 0 ? (
              <View style={styles.emptyBox}>
                <Text style={styles.emptyText}>No active clans found.</Text>
              </View>
            ) : (
              clans.map((c) => (
                <View key={c.id} style={styles.clanCard}>
                  <View style={styles.clanHeader}>
                    <Text style={styles.clanName}>{c.name}</Text>
                    <Text style={styles.clanFocus}>{c.focus || 'Health & Wellness'}</Text>
                  </View>
                  <Text style={styles.clanDesc}>{c.description || 'A supportive Sadé group.'}</Text>
                  <View style={styles.clanFooter}>
                    <Text style={styles.clanMembers}>👥 {c.member_count} Members</Text>
                    <TouchableOpacity style={styles.joinBtn} onPress={() => handleJoinClan(c.id)}>
                      <Text style={styles.joinBtnText}>Join Clan</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ))
            )}
          </View>
        )}

        {/* Tab 3: Gossip Feed */}
        {tab === 'gossip' && !loading && (
          <View>
            {gossips.length === 0 ? (
              <View style={styles.emptyBox}>
                <Text style={styles.emptyText}>No community gossips trending right now.</Text>
              </View>
            ) : (
              gossips.map((g) => (
                <View key={g.id} style={styles.gossipCard}>
                  <Text style={styles.gossipBadge}>LUTEAL VIBE CHECK</Text>
                  <Text style={styles.gossipHeadline}>"{g.headline}"</Text>
                  <Text style={styles.gossipStory}>{g.story}</Text>
                  <Text style={styles.gossipVibe}>Vibe Check: {g.vibe_check}</Text>
                </View>
              ))
            )}
          </View>
        )}
      </ScrollView>

      {/* Modal: Create Post */}
      <Modal visible={createPostVisible} animationType="slide" transparent onRequestClose={() => setCreatePostVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>New Lounge Post</Text>
            {postError ? <Text style={styles.inlineError}>{postError}</Text> : null}
            <TextInput
              style={styles.input}
              placeholder="Post Title"
              placeholderTextColor="#A08C8C"
              value={postTitle}
              onChangeText={setPostTitle}
            />
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="What's on your mind?"
              placeholderTextColor="#A08C8C"
              multiline
              numberOfLines={4}
              value={postBody}
              onChangeText={setPostBody}
            />
            {interestCatalog.length ? (
              <>
                <Text style={styles.modalLabel}>Share with (optional)</Text>
                <View style={styles.interestWrap}>{interestCatalog.map((item) => {
                  const selected = postInterests.includes(item.id);
                  return <TouchableOpacity key={item.id} style={[styles.interestChip, selected && styles.interestChipSelected]} onPress={() => setPostInterests((current) => current.includes(item.id) ? current.filter((id) => id !== item.id) : [...current, item.id])}><Text style={[styles.interestChipText, selected && styles.interestChipTextSelected]}>{item.name}</Text></TouchableOpacity>;
                })}</View>
              </>
            ) : null}
            <TouchableOpacity style={styles.anonymousRow} onPress={() => setPostAnonymous((value) => !value)}>
              <Text style={styles.anonymousText}>Post anonymously</Text>
              <Text style={styles.check}>{postAnonymous ? '●' : '○'}</Text>
            </TouchableOpacity>
            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setCreatePostVisible(false)}>
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.saveBtn, posting && styles.disabled]} onPress={handleCreatePost} disabled={posting}>
                <Text style={styles.saveBtnText}>{posting ? 'Posting…' : 'Post to Lounge'}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Modal: Post detail with likes and replies */}
      <Modal visible={!!activePost} animationType="slide" transparent onRequestClose={() => setActivePost(null)}>
        {activePost ? (
          <View style={styles.modalOverlay}>
            <View style={[styles.modalCard, styles.detailCard]}>
              <View style={styles.detailTopBar}>
                <View style={styles.postHeader}>
                  <View style={styles.avatar}>
                    <Text style={styles.avatarText}>{(activePost.author_name || '?').charAt(0).toUpperCase()}</Text>
                  </View>
                  <View style={styles.postHeaderCopy}>
                    <Text style={styles.postAuthor}>{activePost.author_name || 'Sadé member'}</Text>
                    <Text style={styles.postTime}>{relativeTime(activePost.created_at)}</Text>
                  </View>
                </View>
                <TouchableOpacity onPress={() => setActivePost(null)} style={styles.closeBtn} accessibilityRole="button" accessibilityLabel="Close post">
                  <MaterialCommunityIcons name="close" size={20} color={COLORS.onSurfaceVariant} />
                </TouchableOpacity>
              </View>

              <ScrollView style={styles.detailScroll} contentContainerStyle={styles.detailScrollContent}>
                <Text style={styles.detailTitle}>{activePost.title}</Text>
                <Text style={styles.detailBody}>{activePost.body}</Text>

                <View style={styles.detailActions}>
                  <TouchableOpacity
                    style={[styles.likeButton, activePost.liked_by_me && styles.likeButtonActive]}
                    onPress={() => toggleLike(activePost)}
                    disabled={likeBusyID === activePost.id}
                    accessibilityRole="button"
                    accessibilityLabel={activePost.liked_by_me ? 'Unlike this post' : 'Like this post'}
                  >
                    <MaterialCommunityIcons
                      name={activePost.liked_by_me ? 'heart' : 'heart-outline'}
                      size={18}
                      color={activePost.liked_by_me ? '#FFFFFF' : COLORS.primaryContainer}
                    />
                    <Text style={[styles.likeButtonText, activePost.liked_by_me && styles.likeButtonTextActive]}>
                      {activePost.like_count || 0} {(activePost.like_count || 0) === 1 ? 'like' : 'likes'}
                    </Text>
                  </TouchableOpacity>
                  <Text style={styles.replyCount}>
                    {activePost.comment_count || 0} {(activePost.comment_count || 0) === 1 ? 'reply' : 'replies'}
                  </Text>
                </View>

                <Text style={styles.repliesHeading}>Replies</Text>
                {commentsLoading ? (
                  <ActivityIndicator style={styles.loader} color={COLORS.primaryContainer} />
                ) : comments.length === 0 ? (
                  <Text style={styles.noReplies}>No replies yet. Start the conversation.</Text>
                ) : (
                  comments.map((comment) => (
                    <View key={comment.id} style={styles.commentCard}>
                      <View style={styles.commentHeader}>
                        <Text style={styles.commentAuthor}>{comment.author_name || 'Sadé member'}</Text>
                        <Text style={styles.commentTime}>{relativeTime(comment.created_at)}</Text>
                      </View>
                      <Text style={styles.commentBody}>{comment.body}</Text>
                    </View>
                  ))
                )}
              </ScrollView>

              <View style={styles.replyBar}>
                {replyError ? <Text style={styles.inlineError}>{replyError}</Text> : null}
                <View style={styles.replyRow}>
                  <TextInput
                    style={styles.replyInput}
                    placeholder="Write a reply..."
                    placeholderTextColor="#A08C8C"
                    value={replyBody}
                    onChangeText={setReplyBody}
                    multiline
                  />
                  <TouchableOpacity
                    style={[styles.replyBtn, replying && styles.disabled]}
                    onPress={handleReply}
                    disabled={replying}
                    accessibilityRole="button"
                    accessibilityLabel="Send reply"
                  >
                    <MaterialCommunityIcons name="send" size={18} color="#FFFFFF" />
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </View>
        ) : null}
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  content: {
    padding: 20,
    paddingBottom: 32,
    maxWidth: 500,
    alignSelf: 'center',
    width: '100%',
  },
  header: {
    marginBottom: 16,
  },
  title: {
    fontFamily: 'serif',
    fontSize: 26,
    fontWeight: '700',
    color: COLORS.primary,
  },
  subtitle: {
    fontSize: 12,
    color: COLORS.onSurfaceVariant,
  },
  loader: {
    marginVertical: 20,
  },
  tabRow: {
    flexDirection: 'row',
    backgroundColor: COLORS.surfaceContainerHigh,
    borderRadius: 99,
    padding: 4,
    marginBottom: 20,
  },
  tabBtn: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 99,
    alignItems: 'center',
  },
  tabBtnActive: {
    backgroundColor: COLORS.primaryContainer,
  },
  tabText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.onSurfaceVariant,
  },
  tabTextActive: {
    color: '#FFFFFF',
  },
  newPostBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: COLORS.surfaceContainerLow,
    borderRadius: 16,
    padding: 14,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: COLORS.surfaceContainerHighest,
  },
  newPostBannerText: {
    fontSize: 13,
    color: COLORS.onSurfaceVariant,
  },
  postCard: {
    backgroundColor: COLORS.cardBg,
    borderRadius: 20,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: COLORS.surfaceContainerHighest,
  },
  postHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
    marginBottom: 10,
  },
  avatar: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: COLORS.surfaceContainerHigh,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: COLORS.primary,
    fontSize: 14,
    fontWeight: '800',
  },
  postHeaderCopy: {
    flex: 1,
  },
  postAuthor: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.onSurface,
  },
  postTime: {
    fontSize: 10,
    color: COLORS.outline,
    marginTop: 1,
  },
  postTitle: {
    fontFamily: 'serif',
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.onSurface,
    marginBottom: 4,
  },
  postBody: {
    fontSize: 13,
    color: COLORS.onSurfaceVariant,
    lineHeight: 18,
    marginBottom: 10,
  },
  postFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    borderTopWidth: 1,
    borderTopColor: COLORS.surfaceContainerHighest,
    paddingTop: 10,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingVertical: 2,
  },
  actionText: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.outline,
  },
  actionTextActive: {
    color: COLORS.primaryContainer,
  },
  footerSpacer: {
    flex: 1,
  },
  openHint: {
    fontSize: 10,
    fontWeight: '700',
    color: COLORS.primaryContainer,
  },
  clanCard: {
    backgroundColor: COLORS.cardBg,
    borderRadius: 20,
    padding: 18,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: COLORS.surfaceContainerHighest,
  },
  clanHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  clanName: {
    fontFamily: 'serif',
    fontSize: 17,
    fontWeight: '700',
    color: COLORS.primary,
  },
  clanFocus: {
    fontSize: 10,
    fontWeight: '700',
    color: COLORS.primaryContainer,
    backgroundColor: COLORS.surfaceContainerLow,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 99,
  },
  clanDesc: {
    fontSize: 12,
    color: COLORS.onSurfaceVariant,
    marginBottom: 12,
  },
  clanFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  clanMembers: {
    fontSize: 12,
    color: COLORS.outline,
  },
  joinBtn: {
    backgroundColor: COLORS.primaryContainer,
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 99,
  },
  joinBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  gossipCard: {
    backgroundColor: COLORS.primary,
    borderRadius: 20,
    padding: 18,
    marginBottom: 12,
  },
  gossipBadge: {
    color: '#FFDAD9',
    fontSize: 10,
    fontWeight: '700',
    marginBottom: 4,
  },
  gossipHeadline: {
    fontFamily: 'serif',
    fontSize: 16,
    fontStyle: 'italic',
    color: '#FFFFFF',
    marginBottom: 6,
  },
  gossipStory: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.85)',
    marginBottom: 10,
  },
  gossipVibe: {
    fontSize: 11,
    color: '#FFB3B4',
    fontWeight: '600',
  },
  emptyBox: {
    backgroundColor: COLORS.surfaceContainerLow,
    borderRadius: 18,
    padding: 20,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 12,
    color: COLORS.onSurfaceVariant,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalCard: {
    width: '100%',
    maxWidth: 420,
    backgroundColor: COLORS.cardBg,
    borderRadius: 24,
    padding: 20,
  },
  detailCard: {
    maxHeight: '88%',
    paddingBottom: 14,
  },
  detailTopBar: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.surfaceContainerHigh,
    alignItems: 'center',
    justifyContent: 'center',
  },
  detailScroll: {
    // The card is height-capped, so the thread must shrink and scroll inside it
    // rather than pushing the reply box off the bottom.
    flexShrink: 1,
  },
  detailScrollContent: {
    paddingBottom: 8,
  },
  detailTitle: {
    fontFamily: 'serif',
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.primary,
    marginBottom: 8,
  },
  detailBody: {
    fontSize: 14,
    color: COLORS.onSurface,
    lineHeight: 21,
  },
  detailActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 16,
    marginBottom: 6,
  },
  likeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    borderWidth: 1,
    borderColor: COLORS.primaryContainer,
    borderRadius: 99,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  likeButtonActive: {
    backgroundColor: COLORS.primaryContainer,
  },
  likeButtonText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.primaryContainer,
  },
  likeButtonTextActive: {
    color: '#FFFFFF',
  },
  replyCount: {
    fontSize: 11,
    color: COLORS.outline,
    fontWeight: '600',
  },
  repliesHeading: {
    fontSize: 12,
    fontWeight: '800',
    color: COLORS.onSurface,
    textTransform: 'uppercase',
    letterSpacing: 0.7,
    marginTop: 14,
    marginBottom: 8,
  },
  noReplies: {
    fontSize: 12,
    color: COLORS.onSurfaceVariant,
    paddingVertical: 8,
  },
  commentCard: {
    backgroundColor: COLORS.surfaceContainerLow,
    borderRadius: 14,
    padding: 12,
    marginBottom: 8,
  },
  commentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 3,
  },
  commentAuthor: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.primary,
  },
  commentTime: {
    fontSize: 9,
    color: COLORS.outline,
  },
  commentBody: {
    fontSize: 13,
    color: COLORS.onSurfaceVariant,
    lineHeight: 18,
  },
  replyBar: {
    borderTopWidth: 1,
    borderTopColor: COLORS.surfaceContainerHighest,
    paddingTop: 12,
    marginTop: 8,
  },
  replyRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 8,
  },
  replyInput: {
    flex: 1,
    maxHeight: 96,
    backgroundColor: COLORS.surfaceContainerLow,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 11,
    fontSize: 13,
    color: COLORS.onSurface,
  },
  replyBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: COLORS.primaryContainer,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalTitle: {
    fontFamily: 'serif',
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.primary,
    marginBottom: 14,
  },
  modalLabel: { color: COLORS.onSurface, fontSize: 12, fontWeight: '700', marginBottom: 8 },
  inlineError: {
    color: '#93000A',
    backgroundColor: '#FFDAD6',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 9,
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 12,
  },
  interestWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 7, marginBottom: 12 },
  interestChip: { borderWidth: 1, borderColor: COLORS.roseBorder, borderRadius: 99, paddingHorizontal: 10, paddingVertical: 7 },
  interestChipSelected: { backgroundColor: COLORS.primaryContainer, borderColor: COLORS.primaryContainer },
  interestChipText: { color: COLORS.onSurfaceVariant, fontSize: 10, fontWeight: '700' },
  interestChipTextSelected: { color: '#FFFFFF' },
  anonymousRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 8 },
  anonymousText: { color: COLORS.onSurfaceVariant, fontSize: 12, fontWeight: '600' },
  check: { color: COLORS.primaryContainer, fontSize: 22 },
  disabled: { opacity: 0.5 },
  input: {
    backgroundColor: COLORS.surfaceContainerLow,
    borderRadius: 12,
    padding: 12,
    fontSize: 14,
    color: COLORS.onSurface,
    marginBottom: 12,
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
    marginTop: 10,
  },
  cancelBtn: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 99,
  },
  cancelBtnText: {
    color: COLORS.onSurfaceVariant,
    fontSize: 13,
    fontWeight: '600',
  },
  saveBtn: {
    backgroundColor: COLORS.primaryContainer,
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 99,
  },
  saveBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
});
