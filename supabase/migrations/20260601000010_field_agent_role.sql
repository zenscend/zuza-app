-- ============================================================
-- FIELD AGENT ROLE  — Part 1 of 2
--
-- Run this first, then run Part 2 in a separate query.
-- PostgreSQL requires enum values to be committed before they
-- can be referenced in the same transaction (error 22P04).
-- ============================================================

alter type public.user_role add value if not exists 'field_agent' before 'admin';
