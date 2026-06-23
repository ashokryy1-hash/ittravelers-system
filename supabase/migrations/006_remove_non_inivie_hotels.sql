-- Remove any hotels NOT from Ini Vie chain (manually added non-Ini Vie hotels)
delete from explorer_hotels where chain != 'Ini Vie' or chain is null;
