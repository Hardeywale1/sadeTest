import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
  Alert,
} from 'react-native';
import { communityApi } from '../api/communityApi';
import { interestsApi } from '../api/profileApi';
import { Post, Clan, Gossip, InterestCategory } from '../types';
import { COLORS } from '../theme/colors';

export const CommunityScreen: React.FC = () => {
  const [tab, setTab] = useState<'lounge' | 'clans' | 'gossip'>('lounge');
  const [posts, setPosts] = useState<Post[]>([]);
  const [clans, setClans] = useState<Clan[]>([]);
  const [gossips, setGossips] = useState<Gossip[]>([]);
  const [interestCatalog, setInterestCatalog] = useState<InterestCategory[]>([]);

  // Post modal
  const [createPostVisible, setCreatePostVisible] = useState(false);
  const [postTitle, setPostTitle] = useState('');
  const [postBody, setPostBody] = useState('');
  const [postInterests, setPostInterests] = useState<string[]>([]);
  const [postAnonymous, setPostAnonymous] = useState(false);
  const [posting, setPosting] = useState(false);

  useEffect(() => {
    loadCommunityData();
  }, [tab]);

  useEffect(() => {
    Promise.all([interestsApi.getCatalog(), interestsApi.getSelection()]).then(([catalog, selected]) => {
      setInterestCatalog(catalog);
      setPostInterests(selected.length ? selected : catalog.slice(0, 1).map((item) => item.id));
    }).catch(() => undefined);
  }, []);

  const loadCommunityData = async () => {
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
    } catch (e) {
      console.warn('Community load error:', e);
    }
  };

  const handleCreatePost = async () => {
    if (!postTitle || !postBody) {
      Alert.alert('Error', 'Please enter post title and body.');
      return;
    }
    if (!postInterests.length) {
      Alert.alert('Choose a community', 'Select at least one interest for your post.');
      return;
    }
    setPosting(true);
    try {
      await communityApi.createPost({
        title: postTitle,
        body: postBody,
        interest_ids: postInterests,
        is_anonymous: postAnonymous,
      });
      setPostTitle('');
      setPostBody('');
      setCreatePostVisible(false);
      loadCommunityData();
      setPostAnonymous(false);
    } catch (e: any) {
      Alert.alert('Could not post', e?.response?.data?.error || 'The community backend could not save your post. Please try again.');
    } finally { setPosting(false); }
  };

  const handleJoinClan = async (clanId: string) => {
    try {
      await communityApi.joinClan(clanId);
      Alert.alert('Success', 'Joined Clan!');
      loadCommunityData();
    } catch (e) {
      Alert.alert('Notice', 'Already a member or joined clan.');
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <Text style={styles.title}>The Sanctuary Lounge</Text>
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

        {/* Tab 1: Lounge Posts */}
        {tab === 'lounge' && (
          <View>
            <TouchableOpacity style={styles.newPostBanner} onPress={() => setCreatePostVisible(true)}>
              <Text style={styles.newPostBannerText}>✍️ Share a thought with the sanctuary...</Text>
            </TouchableOpacity>

            {posts.length === 0 ? (
              <View style={styles.emptyBox}>
                <Text style={styles.emptyText}>No community posts yet. Be the first to share!</Text>
              </View>
            ) : (
              posts.map((p) => (
                <View key={p.id} style={styles.postCard}>
                  <Text style={styles.postTitle}>{p.title}</Text>
                  <Text style={styles.postBody}>{p.body}</Text>
                  <View style={styles.postFooter}>
                    <Text style={styles.postMeta}>💬 {p.comment_count} comments</Text>
                    <Text style={styles.postMeta}>{new Date(p.created_at).toLocaleDateString()}</Text>
                  </View>
                </View>
              ))
            )}
          </View>
        )}

        {/* Tab 2: Clans Roster */}
        {tab === 'clans' && (
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
                  <Text style={styles.clanDesc}>{c.description || 'A supportive sanctuary group.'}</Text>
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
        {tab === 'gossip' && (
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
      <Modal visible={createPostVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>New Community Post</Text>
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
            <Text style={styles.modalLabel}>Share with</Text>
            <View style={styles.interestWrap}>{interestCatalog.map((item) => {
              const selected = postInterests.includes(item.id);
              return <TouchableOpacity key={item.id} style={[styles.interestChip, selected && styles.interestChipSelected]} onPress={() => setPostInterests((current) => current.includes(item.id) ? current.filter((id) => id !== item.id) : [...current, item.id])}><Text style={[styles.interestChipText, selected && styles.interestChipTextSelected]}>{item.name}</Text></TouchableOpacity>;
            })}</View>
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
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: COLORS.surfaceContainerHighest,
    paddingTop: 8,
  },
  postMeta: {
    fontSize: 11,
    color: COLORS.outline,
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
  modalTitle: {
    fontFamily: 'serif',
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.primary,
    marginBottom: 14,
  },
  modalLabel: { color: COLORS.onSurface, fontSize: 12, fontWeight: '700', marginBottom: 8 },
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
