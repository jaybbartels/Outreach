'use client'

import { useEffect, useState } from 'react'

interface Comment {
  id: string
  created_at: string
  user_email: string
  comment_text: string
}

export default function ExecutiveComments({
  executiveId,
  domainId,
}: {
  executiveId: string
  domainId: string
}) {
  const [comments, setComments] = useState<Comment[]>([])
  const [newComment, setNewComment] = useState('')
  const [userEmail, setUserEmail] = useState(() =>
    typeof window !== 'undefined' ? localStorage.getItem('userEmail') || 'user@example.com' : 'user@example.com'
  )
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    localStorage.setItem('userEmail', userEmail)
    fetchComments()
  }, [executiveId])

  const fetchComments = async () => {
    try {
      const response = await fetch(`/api/comments?executive_id=${executiveId}`)
      const { data } = await response.json()
      setComments(data || [])
    } catch (error) {
      console.error('Error fetching comments:', error)
    }
  }

  const handleAddComment = async () => {
    if (!newComment.trim()) return

    setLoading(true)
    try {
      await fetch('/api/comments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          executive_id: executiveId,
          user_email: userEmail,
          comment_text: newComment,
          domain_id: domainId,
        }),
      })

      setNewComment('')
      await fetchComments()
    } catch (error) {
      console.error('Error adding comment:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="mt-4 pt-4 border-t">
      <h4 className="font-semibold text-sm mb-2">💬 Notes</h4>

      <div className="space-y-2 mb-3">
        <input
          type="email"
          value={userEmail}
          onChange={(e) => {
            setUserEmail(e.target.value)
            localStorage.setItem('userEmail', e.target.value)
          }}
          placeholder="Your email"
          className="w-full px-2 py-1 border rounded text-xs"
        />
        <textarea
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          placeholder="Add a note..."
          className="w-full px-2 py-1 border rounded text-xs"
          rows={2}
        />
        <button
          onClick={handleAddComment}
          disabled={loading || !newComment.trim()}
          className="w-full px-2 py-1 bg-blue-600 text-white rounded text-xs disabled:opacity-50"
        >
          {loading ? 'Saving...' : 'Add Note'}
        </button>
      </div>

      <div className="space-y-2 max-h-32 overflow-y-auto">
        {comments.map((comment) => (
          <div key={comment.id} className="p-2 bg-gray-50 rounded text-xs border-l-2 border-green-400">
            <p className="font-semibold text-gray-700">{comment.user_email}</p>
            <p className="text-gray-800 mt-1">{comment.comment_text}</p>
            <p className="text-gray-500 text-xs mt-1">{new Date(comment.created_at).toLocaleString()}</p>
          </div>
        ))}
      </div>
    </div>
  )
}
