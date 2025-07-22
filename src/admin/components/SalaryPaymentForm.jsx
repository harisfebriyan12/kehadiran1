@@ .. @@
import React, { useState, useEffect } from 'react';
-import Swal from '../pages/swal';
+import Swal from '../../utils/swal';
import { 
  DollarSign, 
  Calendar, 
  CreditCard, 
  Building, 
  User, 
  Send, 
  X, 
  CheckCircle, 
  AlertTriangle,
  FileText,
  Clock,
  Briefcase
} from 'lucide-react';
-import { supabase } from '../utils/supabaseClient';
+import { supabase } from '../../utils/supabaseClient';

const SalaryPaymentForm = ({ employee, onClose, onPaymentProcessed }) => {