@@ .. @@
import { Bell, X, CheckCircle, AlertTriangle, Clock, FileText, User, Calendar } from 'lucide-react';
-import { supabase } from '../utils/supabaseClient';
+import { supabase } from '../../utils/supabaseClient';

const NotificationSystem = ({ userId, userRole }) => {