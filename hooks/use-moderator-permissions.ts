"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/components/auth/AuthContext";

export function useModeratorPermissions() {
  const { user } = useAuth();
  const [permissions, setPermissions] = useState<{ [key: string]: boolean }>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPermissions = async () => {
      try {
        const res = await fetch('/api/moderator/permissions');
        const data = await res.json();
        
        if (data.success && data.permissions) {
          setPermissions(data.permissions);
        }
      } catch (err) {
        console.error('Failed to fetch moderator permissions:', err);
      } finally {
        setLoading(false);
      }
    };

    if (user?.role === 'MODERATOR') {
      fetchPermissions();
    } else {
      setLoading(false);
    }
  }, [user]);

  const hasPerm = (perm: string) => {
    // ADMIN and SUPER_ADMIN have full access
    if (user?.role === 'SUPER_ADMIN' || user?.role === 'ADMIN') return true;
    
    // Support legacy names
    const legacyMap: { [key: string]: string[] } = {
      'blogWrite': ['blogWrite', 'BLOG_WRITE', 'blog_write', 'blogWriter', 'canWriteBlog'],
      'blogPublish': ['blogPublish', 'BLOG_PUBLISH', 'blog_publish', 'blogPublisher'],
      'aiTestAccess': ['aiTestAccess', 'AI_TEST_ACCESS'],
      'aiTrainingAccess': ['aiTrainingAccess', 'AI_TRAINING_ACCESS'],
      'aiQuestionManage': ['aiQuestionManage', 'AI_QUESTION_MANAGE'],
      'newsWrite': ['newsWrite', 'NEWS_WRITE'],
      'newsPublish': ['newsPublish', 'NEWS_PUBLISH'],
      'supportTicketHandle': ['supportTicketHandle', 'SUPPORT_TICKET_HANDLE'],
      'contentManage': ['contentManage', 'CONTENT_MANAGE'],
      'viewAuditLimited': ['viewAuditLimited', 'VIEW_AUDIT_LIMITED']
    };

    const keysToCheck = legacyMap[perm] || [perm];
    return keysToCheck.some(key => !!permissions[key]);
  };

  return { permissions, hasPerm, loading };
}
