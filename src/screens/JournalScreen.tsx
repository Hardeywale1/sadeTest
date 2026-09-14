import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
} from 'react-native';
import { journalApi } from '../api/journalApi';
import { toast } from '../components/Toast';
import { JournalEntry } from '../types';
import { COLORS } from '../theme/colors';

export const JournalScreen: React.FC = () => {
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedEntry, setSelectedEntry] = useState<JournalEntry | null>(null);

  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [mood, setMood] = useState('Calm');
  const [saving, setSaving] = useState(false);

  const now = new Date();
  const monthlyCount = entries.filter((entry) => {
    const created = new Date(entry.created_at);
    return created.getFullYear() === now.getFullYear() && created.getMonth() === now.getMonth();
  }).length;
  const monthlyLimitReached = monthlyCount >= 20;

  useEffect(() => {
    loadJournal();
  }, []);

  const loadJournal = async () => {
    try {
      const res = await journalApi.listEntries();
      setEntries(res.entries);
    } catch (e) {
      console.warn('Load journal error:', e);
    }
  };

  const handleCreateEntry = async () => {
    if (!body.trim()) {
      toast('Add a reflection', 'Please write something before saving.', 'error');
      return;
    }
    if (monthlyLimitReached) {
      toast('Monthly journal limit reached', 'You can save up to 20 reflections each calendar month. Your existing entries remain available.', 'error');
      return;
    }
    setSaving(true);
    try {
      await journalApi.createEntry({
        title: title || 'Daily Reflection',
        body,
        mood: mood.toLowerCase(),
        tags: ['SelfCare', 'Reflections'],
      });
      setTitle('');
      setBody('');
      setModalVisible(false);
      toast('Reflection saved', undefined, 'success');
      loadJournal();
    } catch (e: any) {
      toast('Could not save reflection', e?.response?.data?.error || 'The backend could not save this entry. Please try again.', 'error');
    } finally { setSaving(false); }
  };

  const handleDeleteEntry = async (id: string) => {
    try {
      await journalApi.deleteEntry(id);
      setSelectedEntry(null);
      loadJournal();
    } catch (e: any) {
      toast('Could not delete', e?.response?.data?.error || 'Failed to delete entry.', 'error');
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.headerRow}>
          <View>
            <Text style={styles.title}>My Journal</Text>
            <Text style={styles.subtitle}>Reflect on your journey toward balance.</Text>
            <Text style={styles.allowance}>{monthlyCount} of 20 reflections used this month</Text>
          </View>
          <TouchableOpacity style={[styles.addBtn, monthlyLimitReached && styles.disabled]} onPress={() => monthlyLimitReached ? toast('Monthly limit reached', 'Your next journal allowance starts next calendar month.', 'error') : setModalVisible(true)}>
            <Text style={styles.addBtnText}>+ New</Text>
          </TouchableOpacity>
        </View>

        {entries.length === 0 ? (
          <View style={styles.emptyBox}>
            <Text style={styles.emptyText}>No journal entries recorded yet.</Text>
            <TouchableOpacity style={styles.createFirstBtn} onPress={() => setModalVisible(true)}>
              <Text style={styles.createFirstText}>Create your first entry</Text>
            </TouchableOpacity>
          </View>
        ) : (
          entries.map((item) => (
            <TouchableOpacity
              key={item.id}
              style={styles.entryCard}
              onPress={() => setSelectedEntry(item)}
            >
              <Text style={styles.entryDate}>{new Date(item.created_at).toLocaleDateString()}</Text>
              <Text style={styles.entryTitle}>{item.title || 'Untitled Reflection'}</Text>
              <Text style={styles.entryBody} numberOfLines={2}>
                {item.body}
              </Text>
              {item.mood ? <Text style={styles.entryMood}>Mood: {item.mood}</Text> : null}
            </TouchableOpacity>
          ))
        )}
      </ScrollView>

      {/* Modal: Create Entry */}
      <Modal visible={modalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>New Reflection</Text>
            <TextInput
              style={styles.input}
              placeholder="Title (optional)"
              placeholderTextColor="#A08C8C"
              value={title}
              onChangeText={setTitle}
            />
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Write your thoughts..."
              placeholderTextColor="#A08C8C"
              multiline
              numberOfLines={4}
              value={body}
              onChangeText={setBody}
            />
            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setModalVisible(false)}>
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.saveBtn, saving && styles.disabled]} onPress={handleCreateEntry} disabled={saving}>
                <Text style={styles.saveBtnText}>{saving ? 'Saving…' : 'Save Reflection'}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Modal: View Single Entry Detail */}
      {selectedEntry && (
        <Modal visible={!!selectedEntry} animationType="fade" transparent>
          <View style={styles.modalOverlay}>
            <View style={styles.modalCard}>
              <Text style={styles.entryDate}>{new Date(selectedEntry.created_at).toLocaleDateString()}</Text>
              <Text style={styles.modalTitle}>{selectedEntry.title || 'Reflection'}</Text>
              <Text style={styles.detailBody}>{selectedEntry.body}</Text>

              <View style={styles.modalActions}>
                <TouchableOpacity
                  style={styles.deleteBtn}
                  onPress={() => handleDeleteEntry(selectedEntry.id)}
                >
                  <Text style={styles.deleteBtnText}>Delete</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.saveBtn} onPress={() => setSelectedEntry(null)}>
                  <Text style={styles.saveBtnText}>Close</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      )}
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
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
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
  allowance: { color: COLORS.primaryContainer, fontSize: 10, fontWeight: '700', marginTop: 4 },
  disabled: { opacity: 0.45 },
  addBtn: {
    backgroundColor: COLORS.primaryContainer,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 99,
  },
  addBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 13,
  },
  entryCard: {
    backgroundColor: COLORS.cardBg,
    borderRadius: 18,
    padding: 16,
    marginBottom: 12,
    borderLeftWidth: 4,
    borderLeftColor: COLORS.primaryContainer,
    borderWidth: 1,
    borderColor: COLORS.surfaceContainerHighest,
  },
  entryDate: {
    fontSize: 10,
    fontWeight: '700',
    color: COLORS.primaryContainer,
    letterSpacing: 0.8,
    marginBottom: 4,
  },
  entryTitle: {
    fontFamily: 'serif',
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.onSurface,
    fontStyle: 'italic',
    marginBottom: 4,
  },
  entryBody: {
    fontSize: 13,
    color: COLORS.onSurfaceVariant,
    lineHeight: 18,
  },
  entryMood: {
    fontSize: 11,
    color: COLORS.outline,
    marginTop: 8,
  },
  emptyBox: {
    backgroundColor: COLORS.surfaceContainerLow,
    borderRadius: 18,
    padding: 24,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 13,
    color: COLORS.onSurfaceVariant,
    marginBottom: 12,
  },
  createFirstBtn: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 99,
  },
  createFirstText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
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
  detailBody: {
    fontSize: 14,
    color: COLORS.onSurface,
    lineHeight: 20,
    marginVertical: 12,
    fontFamily: 'serif',
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
  deleteBtn: {
    backgroundColor: '#FFDAD6',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 99,
  },
  deleteBtnText: {
    color: '#93000A',
    fontSize: 13,
    fontWeight: '700',
  },
});
