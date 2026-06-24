'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Collection } from '@/lib/types'
import CollectionComments from '../CollectionComments'

export default function CollectionPanel({
  collections,
  selectedCollectionId,
  onSelectCollection,
}: {
  collections: Collection[]
  selectedCollectionId: string
  onSelectCollection: (id: string) => void
}) {
  const [showAddForm, setShowAddForm] = useState(false)
  const [newCollectionName, setNewCollectionName] = useState('')
  const [newCollectionSlug, setNewCollectionSlug] = useState('')
  const [newCollectionIcon, setNewCollectionIcon] = useState('📁')
  const [loading, setLoading] = useState(false)

  const selectedCollection = collections.find((c) => c.id === selectedCollectionId)

  const handleAddCollection = async () => {
    if (!newCollectionName.trim() || !newCollectionSlug.trim()) return

    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('collections')
        .insert([
          {
            name: newCollectionName,
            slug: newCollectionSlug,
            icon: newCollectionIcon,
            is_public: true,
          },
        ])
        .select()

      if (!error && data && data.length > 0) {
        onSelectCollection(data[0].id)
        setNewCollectionName('')
        setNewCollectionSlug('')
        setNewCollectionIcon('📁')
        setShowAddForm(false)
        window.location.reload()
      }
    } catch (error) {
      console.error('Error adding collection:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteCollection = async (collectionId: string) => {
    if (!window.confirm('Delete this collection? All associated data will be removed.')) return

    try {
      await supabase.from('collections').delete().eq('id', collectionId)
      onSelectCollection('')
      window.location.reload()
    } catch (error) {
      console.error('Error deleting collection:', error)
    }
  }

  return (
    <div className="bg-yellow-50 rounded-lg shadow-lg border-4 border-yellow-300 overflow-hidden flex flex-col h-full">
      {/* Header */}
      <div className="p-4 bg-yellow-300 border-b-4 border-yellow-400">
        <h2 className="font-bold text-2xl text-yellow-900">📁 COLLECTIONS</h2>
      </div>

      <div className="p-4 border-b-2 border-yellow-200 bg-yellow-100">
        {!showAddForm ? (
          <>
            <select
              value={selectedCollectionId}
              onChange={(e) => {
                if (e.target.value === 'add-new') {
                  setShowAddForm(true)
                } else {
                  onSelectCollection(e.target.value)
                }
              }}
              className="w-full px-3 py-2 border-2 border-yellow-400 rounded font-semibold"
            >
              {collections.map((collection) => (
                <option key={collection.id} value={collection.id || ''}>
                  {collection.icon} {collection.name}
                </option>
              ))}
              <option value="add-new">➕ Add New Collection</option>
            </select>
          </>
        ) : (
          <div className="space-y-2">
            <input
              type="text"
              value={newCollectionName}
              onChange={(e) => setNewCollectionName(e.target.value)}
              placeholder="Collection name"
              className="w-full px-3 py-2 border-2 border-yellow-400 rounded text-sm"
            />
            <input
              type="text"
              value={newCollectionSlug}
              onChange={(e) => setNewCollectionSlug(e.target.value)}
              placeholder="Slug (lowercase, no spaces)"
              className="w-full px-3 py-2 border-2 border-yellow-400 rounded text-sm"
            />
            <input
              type="text"
              value={newCollectionIcon}
              onChange={(e) => setNewCollectionIcon(e.target.value)}
              placeholder="Icon emoji"
              className="w-full px-3 py-2 border-2 border-yellow-400 rounded text-sm"
              maxLength={2}
            />
            <div className="flex gap-2">
              <button
                onClick={handleAddCollection}
                disabled={loading || !newCollectionName.trim()}
                className="flex-1 px-3 py-2 bg-yellow-500 text-white rounded font-semibold disabled:opacity-50"
              >
                {loading ? 'Creating...' : 'Create'}
              </button>
              <button
                onClick={() => setShowAddForm(false)}
                className="flex-1 px-3 py-2 bg-gray-400 text-white rounded font-semibold"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Selected Collection Details */}
      {selectedCollection && !showAddForm && (
        <div className="p-4 border-b-2 border-yellow-200 bg-yellow-100">
          <div className="flex justify-between items-start mb-3">
            <div>
              <h3 className="font-bold text-lg text-yellow-900">{selectedCollection.name}</h3>
              <p className="text-sm text-yellow-700">Slug: {selectedCollection.slug}</p>
            </div>
            <button
              onClick={() => handleDeleteCollection(selectedCollection.id || '')}
              className="px-3 py-1 bg-red-500 text-white rounded font-semibold hover:bg-red-600"
            >
              🗑️ Delete
            </button>
          </div>

          {selectedCollection.id && <CollectionComments collectionId={selectedCollection.id} />}
        </div>
      )}

      {/* Empty state */}
      {!selectedCollection && !showAddForm && (
        <div className="p-4 flex-1 flex items-center justify-center text-yellow-700">
          <p className="text-center font-semibold">Select or create a collection</p>
        </div>
      )}
    </div>
  )
}
