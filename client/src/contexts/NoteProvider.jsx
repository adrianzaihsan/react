import { useState, useEffect, useCallback } from "react";
import axios from "axios";
import { useAuth } from "../hooks/useAuth";
import { NoteContext } from "./NoteContext";

const NoteProvider = ({ children }) => {
  const { token, loading: authLoading } = useAuth();
  const [notes, setNotes] = useState([]);
  const [categories, setCategories] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  // ISOLATED filters - tidak mempengaruhi fetch
  const [filters, setFiltersState] = useState({
    categoryId: null,
    isArchived: false,
    startDate: null,
    endDate: null,
  });

  // SEPARATE fetch function yang tidak tergantung pada filters state
  const fetchNotesWithParams = useCallback(
    async (params = {}) => {
      if (!token) return;

      console.log("🔥 FETCH NOTES WITH PARAMS:", params, new Error().stack);

      try {
        setLoading(true);
        const queryParams = new URLSearchParams();

        if (params.categoryId)
          queryParams.append("categoryId", params.categoryId);
        if (params.isArchived !== null && params.isArchived !== undefined)
          queryParams.append("isArchived", params.isArchived);
        if (params.startDate && params.endDate) {
          queryParams.append("startDate", params.startDate);
          queryParams.append("endDate", params.endDate);
        }

        const res = await axios.get(
          `http://localhost:5001/api/notes?${queryParams}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
        setNotes(res.data.notes);
      } catch (error) {
        console.error("Error fetching notes:", error);
        if (error.response?.status === 401) {
          console.error("Authentication error - token may be invalid");
        }
      } finally {
        setLoading(false);
      }
    },
    [token]
  );

  const fetchCategories = useCallback(async () => {
    if (!token) return;

    try {
      const res = await axios.get("http://localhost:5001/api/categories", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      setCategories(res.data.categories);
    } catch (error) {
      console.error("Error fetching categories:", error);
      if (error.response?.status === 401) {
        console.error("Authentication error - token may be invalid");
      }
    }
  }, [token]);

  const fetchStats = useCallback(async () => {
    if (!token) return;

    try {
      const res = await axios.get("http://localhost:5001/api/notes/stats", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      setStats(res.data.stats);
    } catch (error) {
      console.error("Error fetching stats:", error);
      if (error.response?.status === 401) {
        console.error("Authentication error - token may be invalid");
      }
    }
  }, [token]);

  // Initial load - ONLY run once when token is available
  useEffect(() => {
    if (token && !authLoading) {
      console.log("🚀 INITIAL LOAD");

      // Call functions directly to avoid dependency issues
      (async () => {
        try {
          // Fetch categories
          const categoriesRes = await axios.get(
            "http://localhost:5001/api/categories",
            {
              headers: { Authorization: `Bearer ${token}` },
            }
          );
          setCategories(categoriesRes.data.categories);

          // Fetch stats
          const statsRes = await axios.get(
            "http://localhost:5001/api/notes/stats",
            {
              headers: { Authorization: `Bearer ${token}` },
            }
          );
          setStats(statsRes.data.stats);

          // Fetch notes with initial filters
          const initialFilters = {
            categoryId: null,
            isArchived: false,
            startDate: null,
            endDate: null,
          };

          setLoading(true);
          const queryParams = new URLSearchParams();
          if (initialFilters.categoryId)
            queryParams.append("categoryId", initialFilters.categoryId);
          if (initialFilters.isArchived !== null)
            queryParams.append("isArchived", initialFilters.isArchived);
          if (initialFilters.startDate && initialFilters.endDate) {
            queryParams.append("startDate", initialFilters.startDate);
            queryParams.append("endDate", initialFilters.endDate);
          }

          const notesRes = await axios.get(
            `http://localhost:5001/api/notes?${queryParams}`,
            {
              headers: { Authorization: `Bearer ${token}` },
            }
          );
          setNotes(notesRes.data.notes);
        } catch (error) {
          console.error("Error in initial load:", error);
        } finally {
          setLoading(false);
        }
      })();
    }
  }, [token, authLoading]); // Only depend on token and authLoading

  // SAFE setFilters - does NOT trigger fetch
  const setFilters = useCallback((newFilters) => {
    console.log("📋 SET FILTERS (NO AUTO FETCH):", newFilters);
    if (typeof newFilters === "function") {
      setFiltersState(newFilters);
    } else {
      setFiltersState(newFilters);
    }
  }, []);

  // Manual fetch with current filters
  const manualFetchNotes = useCallback(() => {
    console.log("🔄 MANUAL FETCH WITH CURRENT FILTERS");
    fetchNotesWithParams(filters);
  }, [fetchNotesWithParams, filters]);

  // Reset filters and fetch
  const resetFilters = useCallback(
    (isArchived = false) => {
      const newFilters = {
        categoryId: null,
        isArchived: isArchived,
        startDate: null,
        endDate: null,
      };
      setFiltersState(newFilters);
      fetchNotesWithParams(newFilters);
    },
    [fetchNotesWithParams]
  );

  const createNote = async (noteData) => {
    try {
      console.log("➕ CREATING NOTE:", noteData);
      const res = await axios.post(
        "http://localhost:5001/api/notes",
        noteData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      // Use the note from response if available
      if (res.data.note) {
        setNotes((prevNotes) => [res.data.note, ...prevNotes]);
      } else if (res.data.noteId) {
        // Fallback: fetch the newly created note if only ID is returned
        const newNoteRes = await axios.get(
          `http://localhost:5001/api/notes/${res.data.noteId}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
        if (newNoteRes.data.note) {
          setNotes((prevNotes) => [newNoteRes.data.note, ...prevNotes]);
        }
      }

      await fetchStats();
      return { success: true };
    } catch (error) {
      console.error("Error creating note:", error);
      return {
        success: false,
        message: error.response?.data?.message || "Failed to create note",
      };
    }
  };

  const updateNote = async (id, noteData) => {
    try {
      console.log("✏️ UPDATING NOTE:", id, noteData);
      const res = await axios.put(
        `http://localhost:5001/api/notes/${id}`,
        noteData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      // Use the updated note from response if available
      if (res.data.note) {
        setNotes((prevNotes) =>
          prevNotes.map((note) => (note.id === id ? res.data.note : note))
        );
      } else {
        // Fallback: update locally
        setNotes((prevNotes) =>
          prevNotes.map((note) =>
            note.id === id ? { ...note, ...noteData } : note
          )
        );
      }

      return { success: true };
    } catch (error) {
      console.error("Error updating note:", error);
      return {
        success: false,
        message: error.response?.data?.message || "Failed to update note",
      };
    }
  };

  const deleteNote = async (id) => {
    try {
      await axios.delete(`http://localhost:5001/api/notes/${id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      // Remove from state instead of refetching
      setNotes((prevNotes) => prevNotes.filter((note) => note.id !== id));
      await fetchStats();

      return { success: true };
    } catch (error) {
      console.error("Error deleting note:", error);
      return {
        success: false,
        message: error.response?.data?.message || "Failed to delete note",
      };
    }
  };

  const archiveNote = async (id) => {
    try {
      await axios.put(
        `http://localhost:5001/api/notes/${id}/archive`,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      // Remove from current view if not showing archived
      if (!filters.isArchived) {
        setNotes((prevNotes) => prevNotes.filter((note) => note.id !== id));
      }

      await fetchStats();
      return { success: true };
    } catch (error) {
      console.error("Error archiving note:", error);
      return {
        success: false,
        message: error.response?.data?.message || "Failed to archive note",
      };
    }
  };

  const unarchiveNote = async (id) => {
    try {
      await axios.put(
        `http://localhost:5001/api/notes/${id}/unarchive`,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      // Remove from current view if showing archived
      if (filters.isArchived) {
        setNotes((prevNotes) => prevNotes.filter((note) => note.id !== id));
      }

      await fetchStats();
      return { success: true };
    } catch (error) {
      console.error("Error unarchiving note:", error);
      return {
        success: false,
        message: error.response?.data?.message || "Failed to unarchive note",
      };
    }
  };

  const createCategory = async (name) => {
    try {
      await axios.post(
        "http://localhost:5001/api/categories",
        { name },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      await fetchCategories();
      return { success: true };
    } catch (error) {
      console.error("Error creating category:", error);
      return {
        success: false,
        message: error.response?.data?.message || "Failed to create category",
      };
    }
  };

  const updateCategory = async (id, name) => {
    try {
      await axios.put(
        `http://localhost:5001/api/categories/${id}`,
        { name },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      await fetchCategories();
      return { success: true };
    } catch (error) {
      console.error("Error updating category:", error);
      return {
        success: false,
        message: error.response?.data?.message || "Failed to update category",
      };
    }
  };

  const deleteCategory = async (id) => {
    try {
      await axios.delete(`http://localhost:5001/api/categories/${id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      await fetchCategories();
      return { success: true };
    } catch (error) {
      console.error("Error deleting category:", error);
      return {
        success: false,
        message: error.response?.data?.message || "Failed to delete category",
      };
    }
  };

  const refreshData = useCallback(() => {
    fetchNotesWithParams(filters);
    fetchCategories();
    fetchStats();
  }, [fetchNotesWithParams, fetchCategories, fetchStats, filters]);

  const value = {
    notes,
    categories,
    stats,
    loading,
    filters,
    setFilters, // SAFE - does not auto fetch
    manualFetchNotes, // Manual fetch when needed
    resetFilters,
    createNote,
    updateNote,
    deleteNote,
    archiveNote,
    unarchiveNote,
    createCategory,
    updateCategory,
    deleteCategory,
    refreshData,
  };

  return <NoteContext.Provider value={value}>{children}</NoteContext.Provider>;
};

export default NoteProvider;
