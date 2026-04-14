"use client";

import { useState, useEffect, useMemo } from "react";
import type { User } from "@/src/models/users.model";
import * as Models from "@/src/models/clients.model";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { CustomSelect } from "@/components/ui/custom-select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Search,
  Plus,
  Eye,
  Edit,
  Trash2,
  RefreshCw,
  UserIcon,
  MapPin,
  Calendar,
  Phone,
  Mail,
  FileText,
  Heart,
  Briefcase,
  GraduationCap,
  Car,
  Users,
  CreditCard,
  Download,
  Building,
} from "lucide-react";
import { getCurrentUser, setCurrentUser, hasPermission } from "@/lib/auth";
import * as ClientAPI from "@/src/api/clients.api";
import * as AuthAPI from "@/src/api/auth.api";
import { Spinner } from "@/components/ui/spinner";
import { useToast } from "@/components/ui/use-toast";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Textarea } from "@/components/ui/textarea";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { PaginationControls } from "@/components/ui/pagination-controls";

const EMPTY_CLIENT: Models.CreateClientRequest = {
  // Common fields
  name: "",
  bin_iin: "",
  address: "",
  actual_address: "",
  phone: "",
  email: "",
  contact_info: "",
  client_type: "individual",
  owner_id: 0,
  
  // Legal entity banking fields (main table)
  contact_person_position: "",
  bank_name: "",
  iban: "",
  bik: "",
  kbe: "",
  
  // Legal profile structure
  legal_profile: {
    company_name: "",
    bin: "",
    legal_form: "",
    director_full_name: "",
    contact_person_name: "",
    contact_person_phone: "",
    contact_person_email: "",
    legal_address: "",
    tax_regime: "",
    website: "",
    industry: "",
    company_size: "",
    additional_info: "",
  },
  
  // Individual specific fields (optional for legal clients)
  last_name: "",
  first_name: "",
  middle_name: "",
  iin: "",
  id_number: "",
  id_issue_date: "",
  id_expire_date: "",
  passport_series: "",
  passport_number: "",
  passport_issue_date: "",
  passport_expire_date: "",
  registration_address: "",
  residential_address: "",
  country: "",
  country_other: "",
  trip_purpose: "",
  trip_purpose_other: "",
  birth_date: "",
  birth_place: "",
  citizenship: "",
  sex: "",
  marital_status: "",
  previous_last_name: "",
  spouse_name: "",
  spouse_contacts: "",
  has_children: false,
  children_list: "",
  education_level: "",
  specialty: "",
  education_institution: "",
  education_institution_address: "",
  job: "",
  position: "",
  trips_last5_years: "",
  visas_received: "",
  visa_refusals: "",
  relatives_in_destination: "",
  trusted_person: "",
  trusted_person_phone: "",
  height: 0,
  weight: 0,
  driver_license_number: "",
  driver_license_issue_date: "",
  driver_license_expire_date: "",
  driver_license_categories: "",
  therapist_name: "",
  clinic_name: "",
  diseases_last3_years: "",
  additional_info: "",
  photo_35x45: "",
};

const DetailItem = ({ label, value }: { label: string; value?: string | null }) => (
  <div>
    <p className="text-sm text-gray-500">{label}</p>
    <p className="font-medium">{value || "-"}</p>
  </div>
);

export default function ClientsPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [clientTypeFilter, setClientTypeFilter] = useState("");
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [clientFormData, setClientFormData] =
    useState<Models.CreateClientRequest>(EMPTY_CLIENT);
  const [editingClient, setEditingClient] = useState<Models.Client | null>(
    null
  );

  // Reset individual/legal specific fields when client_type changes (only when creating, not editing)
  useEffect(() => {
    if (!editingClient) {
      if (clientFormData.client_type === "legal") {
        setClientFormData(prev => ({
          ...prev,
          last_name: "",
          first_name: "",
          middle_name: "",
          iin: "",
          id_number: "",
          id_issue_date: "",
          id_expire_date: "",
          passport_series: "",
          passport_number: "",
          passport_issue_date: "",
          passport_expire_date: "",
          registration_address: "",
          residential_address: "",
          country: "",
          country_other: "",
          trip_purpose: "",
          trip_purpose_other: "",
          birth_date: "",
          birth_place: "",
          citizenship: "",
          sex: "",
          marital_status: "",
          previous_last_name: "",
          spouse_name: "",
          spouse_contacts: "",
          has_children: false,
          children_list: "",
          education_level: "",
          specialty: "",
          education_institution: "",
          education_institution_address: "",
          education: "",
          job: "",
          position: "",
          trips_last5_years: "",
          visas_received: "",
          visa_refusals: "",
          relatives_in_destination: "",
          trusted_person: "",
          trusted_person_phone: "",
          height: 0,
          weight: 0,
          driver_license_number: "",
          driver_license_issue_date: "",
          driver_license_expire_date: "",
          driver_license_categories: "",
          therapist_name: "",
          clinic_name: "",
          diseases_last3_years: "",
          additional_info: "",
          photo_35x45: "",
        }));
      } else {
        setClientFormData(prev => ({
          ...prev,
          name: "",
          bin_iin: "",
          address: "",
          contact_info: "",
          contact_person_position: "",
          bank_name: "",
          iban: "",
          bik: "",
          kbe: "",
          legal_profile: {
            ...prev.legal_profile,
            company_name: "",
            bin: "",
            legal_form: "",
            director_full_name: "",
            contact_person_name: "",
            contact_person_phone: "",
            contact_person_email: "",
            legal_address: "",
            tax_regime: "",
            website: "",
            industry: "",
            company_size: "",
            additional_info: "",
          },
        }));
      }
    }
  }, [clientFormData.client_type, editingClient]);
  const [clientToDelete, setClientToDelete] = useState<Models.Client | null>(null);
  const [viewingClient, setViewingClient] = useState<Models.Client | null>(null);
  const [selectedPhotoFile, setSelectedPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [clientProfile, setClientProfile] = useState<any>(null);
  const [clientPhotoUrl, setClientPhotoUrl] = useState<string | null>(null);

  const [clients, setClients] = useState<Models.Client[]>([]);
  const [totalClients, setTotalClients] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const searchParams = useSearchParams();
  const pathname = usePathname();
  const router = useRouter();
  const currentPage = Number(searchParams.get('page')) || 1;
  const limit = 20;

  const { toast } = useToast();
  // Remove useMemo - get fresh user data every time
  const [clientView, setClientView] = useState<"all" | "my">(() => {
    // Initialize with correct view based on user role
    const currentUser = getCurrentUser();
    return (currentUser?.role === 'sales' || currentUser?.role_id === 10) ? 'my' : 'all';
  });
  
  // State for fresh user data from API
  const [freshUserData, setFreshUserData] = useState<any>(null);
  
  // Get fresh user data for each render
  const user = freshUserData || getCurrentUser();
  const canCreate = user && hasPermission(user.role, ["clients:write"]);
  const canEdit = user && hasPermission(user.role, ["clients:write"]);
  const canDelete = user && hasPermission(user.role, ["clients:write"]);

  // Debug logging
  useEffect(() => {
    console.log('Clients page debug:', {
      user: user,
      userRole: user?.role,
      canCreate,
      canEdit,
      canDelete
    });
  }, [user, canCreate, canEdit, canDelete]);

  // Fetch fresh user data on mount
  useEffect(() => {
    const fetchFreshUserData = async () => {
      try {
        console.log('Fetching fresh user data...');
        const userData = await AuthAPI.getMe();
        console.log('Fresh user data received:', userData);
        
        // Transform API response to match User interface
        const transformedUser = {
          id: String(userData.id),
          firstName: userData.company_name || userData.email?.split('@')[0] || '',
          lastName: '',
          email: userData.email,
          phone: userData.phone,
          role: userData.role_id === 50 ? 'system_admin' :
                userData.role_id === 40 ? 'leadership' :
                userData.role_id === 30 ? 'control' :
                userData.role_id === 20 ? 'operations' :
                userData.role_id === 15 ? 'backoffice_admin_staff' :
                userData.role_id === 10 ? 'sales' : 'user',
          role_id: userData.role_id,
          company_name: userData.company_name,
          bin_iin: userData.bin_iin,
          is_verified: userData.is_verified,
          verified_at: userData.verified_at,
          telegram_chat_id: userData.telegram_chat_id,
          notify_tasks_telegram: userData.notify_tasks_telegram,
          status: 'active'
        };
        
        console.log('Transformed user data:', transformedUser);
        setFreshUserData(transformedUser);
        
        // Update localStorage with fresh data
        setCurrentUser(transformedUser);
      } catch (error) {
        console.error('Failed to fetch fresh user data:', error);
      }
    };
    
    fetchFreshUserData();
  }, []); // Run once on mount

  const fetchClients = async () => {
    console.log('=== FETCH CLIENTS DEBUG ===');
    console.log('fetchClients called with:', {
      userRole: user?.role,
      clientView,
      currentPage,
      searchTerm,
      isLoading
    });

    setIsLoading(true);
    setError("");
    try {
      const params: any = { page: currentPage, size: limit };
      if (searchTerm) params.search = searchTerm;
      if (clientTypeFilter) params.client_type = clientTypeFilter;

      // Prevent sales users from accessing full client list - AGGRESSIVE FIX
      const currentUser = getCurrentUser(); // Get fresh user data
      let effectiveView = (currentUser?.role === 'sales' || currentUser?.role_id === 10) ? 'my' : clientView;

      // DOUBLE SAFEGUARD: If user is sales, ALWAYS use 'my' view regardless of state
      if (currentUser?.role === 'sales' || currentUser?.role_id === 10) {
        effectiveView = 'my';
        console.log('SAFEGUARD: Forced to my view for sales user');
      }

      console.log('fetchClients API call:', {
        userRole: currentUser?.role,
        userId: currentUser?.role_id,
        clientView,
        effectiveView,
        endpoint: effectiveView === "all" ? '/clients' : '/clients/my',
        params,
        'currentUser?.role === "sales"': currentUser?.role === 'sales',
        'currentUser?.role_id === 10': currentUser?.role_id === 10,
        'effectiveView === "all"': effectiveView === "all",
        'calling listClients?': effectiveView === "all"
      });

      // Check auth token
      const authToken = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
      console.log('Auth token present:', !!authToken);
      console.log('Auth token (first 20 chars):', authToken?.substring(0, 20) + '...');

      // Try to decode JWT to check user_id
      if (authToken) {
        try {
          const base64Url = authToken.split('.')[1];
          const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
          const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
            return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
          }).join(''));
          const decoded = JSON.parse(jsonPayload);
          console.log('Decoded JWT payload:', {
            user_id: decoded.user_id,
            role_id: decoded.role_id,
            exp: decoded.exp,
            iat: decoded.iat
          });
        } catch (e) {
          console.log('Failed to decode JWT:', e);
        }
      }

      // Use proper API based on user role
      console.log('Choosing API endpoint based on role:', {
        currentUserRole: currentUser?.role,
        isSales: currentUser?.role === 'sales',
        willCall: currentUser?.role === 'sales' ? 'listMyClients' : 'listClients'
      });

      // More robust role check - handle different formats and undefined roles
      const userRole = currentUser?.role;
      const userId = currentUser?.role_id;
      const isSalesRole = (!userRole && !userId) || userRole === 'sales' || userRole === 'Sales' || userRole?.toString().toLowerCase() === 'sales' || userId === 10;

      console.log('Final role check:', { isSalesRole, userRole: currentUser?.role, userId: currentUser?.role_id });

      // AGGRESSIVE SAFEGUARD: If we get 403 on listClients, fallback to listMyClients
      let res;
      try {
        if (isSalesRole) {
          console.log('Using listMyClients for sales user');
          res = await ClientAPI.listMyClients(params);
        } else {
          console.log('Trying listClients for non-sales user');
          res = await ClientAPI.listClients(params);
        }
      } catch (error: any) {
        console.log('listClients failed, falling back to listMyClients:', error?.message);
        console.log('Error details:', {
          status: error?.response?.status,
          statusText: error?.response?.statusText,
          data: error?.response?.data,
          code: error?.code
        });
        res = await ClientAPI.listMyClients(params);
      }

      console.log('API call completed - used fallback endpoint');

      console.log('API response:', res);
      console.log('Response type:', Array.isArray(res) ? 'array' : 'object');

      const data = Array.isArray(res) ? res : (res as any)?.data || [];
      const total = (res as any)?.total || data.length;

      console.log('Processed data:', {
        dataLength: data.length,
        total,
        isArray: Array.isArray(data),
        firstItem: data[0]
      });

      setClients(Array.isArray(data) ? data : []);
      setTotalClients(total);

      console.log('State updated - clients count:', data.length);
    } catch (err: any) {
      console.error('fetchClients error:', err);
      console.error('Error details:', {
        status: err?.response?.status,
        statusText: err?.response?.statusText,
        data: err?.response?.data,
        code: err?.code,
        message: err?.message
      });
      setError(err?.message || "Ошибка при загрузке клиентов");
      toast({
        variant: "destructive",
        title: "Ошибка",
        description: err?.message || "Не удалось загрузить клиентов.",
      });
    } finally {
      setIsLoading(false);
      console.log('fetchClients completed');
    }
  };

  const handleRefresh = () => {
    console.log('handleRefresh called:', { 
      user: user?.role, 
      clientView,
      userLoaded: !!user 
    });
    
    // Ensure user is loaded before refreshing
    if (!user) {
      console.log('User not loaded, skipping refresh');
      return;
    }
    
    // Force correct view for sales users
    if (user.role === 'sales' && clientView === 'all') {
      console.log('Sales user with all view, switching to my view');
      setClientView('my');
      return; // Let the effect handle the fetch
    }
    
    console.log('Proceeding with fetchClients');
    fetchClients();
  };

  const handlePageChange = (page: number) => {
    const params = new URLSearchParams(searchParams);
    params.set('page', page.toString());
    router.push(`${pathname}?${params.toString()}`);
  };

  useEffect(() => {
    console.log('=== USEEFFECT 0: Initial User Check ===');
    const currentUser = getCurrentUser();
    console.log('Initial user check:', currentUser);
    
    if ((currentUser?.role === 'sales' || currentUser?.role_id === 10) && clientView === 'all') {
      console.log('Sales user detected - forcing my view');
      setClientView('my');
    }
  }, []); // Run once on mount

useEffect(() => {
    console.log('=== USEEFFECT 1: User/Role Change ===');
    console.log('User:', user);
    console.log('Client view:', clientView);
    if ((user?.role === 'sales' || user?.role_id === 10) && clientView === 'all') {
      console.log('Sales user detected - forcing my view');
      setClientView('my');
    }
  }, [user]); // Remove clientView from dependencies to prevent infinite loop

  useEffect(() => {
    console.log('=== USEEFFECT 2: Main Fetch Trigger ===');
    console.log('Dependencies:', { clientView, currentPage, user });
    // Only fetch clients if we have a user and proper view state
    if (user) {
      console.log('User exists - calling fetchClients');
      fetchClients();
    } else {
      console.log('No user - skipping fetchClients');
    }
  }, [clientView, currentPage, clientTypeFilter]); // Remove user from deps - we get fresh data in fetchClients

  useEffect(() => {
    console.log('=== USEEFFECT 3: Search Debounce ===');
    console.log('Search term changed:', searchTerm);
    const timer = setTimeout(() => {
      console.log('Debounce trigger - calling fetchClients');
      fetchClients(); // Always call fetchClients - it will get fresh user data
    }, 500);
    return () => clearTimeout(timer);
  }, [searchTerm]); // Remove user from deps

  const handleFormChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { id, value } = e.target;
    // Convert height and weight to numbers
    if (id === 'height' || id === 'weight') {
      setClientFormData((prev) => ({ ...prev, [id]: value ? Number(value) : 0 }));
    } else if (['legal_form', 'director_full_name', 'tax_regime', 'website', 'industry', 'company_size'].includes(id)) {
      // Handle legal_profile nested fields
      setClientFormData((prev) => ({
        ...prev,
        legal_profile: {
          ...prev.legal_profile,
          [id]: value
        }
      }));
    } else {
      setClientFormData((prev) => ({ ...prev, [id]: value }));
    }
  };

  const handleBooleanChange = (id: string, value: string) => {
    setClientFormData((prev) => ({ ...prev, [id]: value === 'true' }));
  };

  const handleCreateClick = () => {
    resetForm();
    setIsFormOpen(true);
  };

  const handleEditClick = (client: Models.Client) => {
    resetForm(true); // Keep editingClient = false initially
    setEditingClient(client);
    setClientFormData({
      // Organization info
      name: client.name || "",
      bin_iin: client.bin_iin || "",
      address: client.address || "",
      contact_info: client.contact_info || "",
      client_type: client.client_type || "individual",

      // Legal entity banking fields (main table)
      contact_person_position: client.contact_person_position || "",
      bank_name: client.bank_name || "",
      iban: client.iban || "",
      bik: client.bik || "",
      kbe: client.kbe || "",

      // Legal profile nested fields
      legal_profile: {
        company_name: client.legal_profile?.company_name || client.name || "",
        bin: client.legal_profile?.bin || client.bin_iin || "",
        legal_form: client.legal_profile?.legal_form || "",
        director_full_name: client.legal_profile?.director_full_name || "",
        contact_person_name: client.legal_profile?.contact_person_name || client.contact_info || "",
        contact_person_phone: client.legal_profile?.contact_person_phone || client.phone || "",
        contact_person_email: client.legal_profile?.contact_person_email || client.email || "",
        legal_address: client.legal_profile?.legal_address || client.address || "",
        tax_regime: client.legal_profile?.tax_regime || "",
        website: client.legal_profile?.website || "",
        industry: client.legal_profile?.industry || "",
        company_size: client.legal_profile?.company_size || "",
        additional_info: client.legal_profile?.additional_info || "",
      },

      // Required fields (RED)
      country: client.country || "",
      trip_purpose: client.trip_purpose || "",
      last_name: client.last_name || "",
      first_name: client.first_name || "",
      birth_date: client.birth_date || "",
      phone: client.phone || "",

      // Additional required fields
      middle_name: client.middle_name || "",
      birth_place: client.birth_place || "",
      citizenship: client.citizenship || "",
      sex: client.sex || "",
      marital_status: client.marital_status || "",
      iin: client.iin || "",
      id_number: client.id_number || "",
      passport_series: client.passport_series || "",
      passport_number: client.passport_number || "",
      passport_issue_date: client.passport_issue_date || "",
      passport_expire_date: client.passport_expire_date || "",
      registration_address: client.registration_address || "",
      actual_address: client.actual_address || "",
      email: client.email || "",
      photo_35x45: client.photo_35x45 || "",

      // Optional fields
      previous_last_name: client.previous_last_name || "",
      spouse_name: client.spouse_name || "",
      spouse_contacts: client.spouse_contacts || "",
      has_children: client.has_children || false,
      children_list: client.children_list || "",
      education: client.education || "",
      job: client.job || "",
      trips_last5_years: client.trips_last5_years || "",
      relatives_in_destination: client.relatives_in_destination || "",
      trusted_person: client.trusted_person || "",
      height: client.height || 0,
      weight: client.weight || 0,
      driver_license_categories: client.driver_license_categories || "",
      therapist_name: client.therapist_name || "",
      clinic_name: client.clinic_name || "",
      diseases_last3_years: client.diseases_last3_years || "",
      additional_info: client.additional_info || "",
    });
    setIsFormOpen(true);
  };

  const handleDeleteClick = (client: Models.Client) => {
    setClientToDelete(client);
  };

  const handleViewClick = async (client: Models.Client) => {
    setViewingClient(client);
    setClientPhotoUrl(null);
    try {
      const profile = await ClientAPI.getClientProfile(client.id.toString());
      setClientProfile(profile);

      // Update viewingClient with profile data to include legal_profile with banking fields
      if (profile?.client) {
        setViewingClient(profile.client as any);
      }
      
      // Fetch authenticated photo if it exists
      if (profile?.files?.photo35x45?.exists) {
        const photoUrl = await ClientAPI.getClientPhoto(client.id.toString());
        setClientPhotoUrl(photoUrl);
      }
    } catch (error) {
      console.error('Failed to fetch client profile:', error);
      setClientProfile(null);
      setClientPhotoUrl(null);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!clientToDelete) return;
    try {
      await ClientAPI.deleteClient(clientToDelete.id.toString());
      toast({ title: "Успех", description: "Клиент успешно удален." });
      void fetchClients(); // Refresh list
    } catch (err: any) {
      console.error("Delete client error", err);
      toast({
        variant: "destructive",
        title: "Ошибка",
        description: err?.message || "Не удалось удалить клиента.",
      });
    } finally {
      setClientToDelete(null);
    }
  };

  const validateRequiredFields = (): boolean => {
    const requiredFields = ['client_type', 'phone'];

    // Individual-specific required fields
    if (clientFormData.client_type === "individual") {
      requiredFields.push('last_name', 'first_name');
    }

    // Legal-specific required fields
    if (clientFormData.client_type === "legal") {
      requiredFields.push('name', 'bin_iin');
    }

    const missingFields = requiredFields.filter(field => !clientFormData[field as keyof Models.CreateClientRequest]);
    
    if (missingFields.length > 0) {
      toast({
        variant: "destructive",
        title: "Ошибка валидации",
        description: "Пожалуйста, заполните все обязательные поля, отмеченные красным цветом.",
      });
      return false;
    }
    
    return true;
  };

  const handlePhotoSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Validate file type
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png'];
      if (!allowedTypes.includes(file.type)) {
        toast({
          variant: "destructive",
          title: "Ошибка",
          description: "Пожалуйста, выберите файл изображения (JPG, JPEG, PNG).",
        });
        return;
      }
      
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast({
          variant: "destructive",
          title: "Ошибка",
          description: "Размер файла не должен превышать 5 МБ.",
        });
        return;
      }
      
      setSelectedPhotoFile(file);
      
      // Create preview
      const reader = new FileReader();
      reader.onload = () => {
        setPhotoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const clearPhoto = () => {
    setSelectedPhotoFile(null);
    setPhotoPreview(null);
  };

  const resetForm = (keepEditingClient = false) => {
    setClientFormData(EMPTY_CLIENT);
    setSelectedPhotoFile(null);
    setPhotoPreview(null);
    if (!keepEditingClient) {
      setEditingClient(null);
    }
  };

  const handleSubmit = async () => {
    console.log('=== CLIENT SUBMISSION DEBUG ===');
    console.log('Editing client:', editingClient);
    console.log('Current form data:', clientFormData);
    console.log('Client type:', clientFormData.client_type);
    console.log('Selected photo file:', selectedPhotoFile);
    console.log('Required fields validation:');
    
    if (!validateRequiredFields()) {
      console.log('Validation failed - missing required fields');
      return;
    }
    
    console.log('Validation passed - proceeding with API call');

    // Prepare payload - only send relevant fields based on client_type
    const payload: any = {
      client_type: clientFormData.client_type,
      // Common fields
      name: clientFormData.name || "",
      bin_iin: clientFormData.bin_iin || "",
      address: clientFormData.address || "",
      actual_address: clientFormData.actual_address || "",
      phone: clientFormData.phone || "",
      email: clientFormData.email || "",
      contact_info: clientFormData.contact_info || "",
      // Banking fields (main table)
      contact_person_position: clientFormData.contact_person_position || "",
      bank_name: clientFormData.bank_name || "",
      iban: clientFormData.iban || "",
      bik: clientFormData.bik || "",
      kbe: clientFormData.kbe || "",
      photo_35x45: clientFormData.photo_35x45 || "",
    };

    // Add legal_profile for legal clients
    if (clientFormData.client_type === "legal") {
      payload.legal_profile = {
        company_name: clientFormData.name || "",
        bin: clientFormData.bin_iin || "",
        legal_form: clientFormData.legal_profile?.legal_form || "",
        director_full_name: clientFormData.legal_profile?.director_full_name || "",
        contact_person_name: clientFormData.contact_info || "",
        contact_person_phone: clientFormData.phone || "",
        contact_person_email: clientFormData.email || "",
        legal_address: clientFormData.address || "",
        tax_regime: clientFormData.legal_profile?.tax_regime || "",
        website: clientFormData.legal_profile?.website || "",
        industry: clientFormData.legal_profile?.industry || "",
        company_size: clientFormData.legal_profile?.company_size || "",
        additional_info: clientFormData.legal_profile?.additional_info || "",
      };
    } else {
      // Individual client fields
      payload.last_name = clientFormData.last_name || "";
      payload.first_name = clientFormData.first_name || "";
      payload.middle_name = clientFormData.middle_name || "";
      payload.iin = clientFormData.iin || "";
      payload.id_number = clientFormData.id_number || "";
      payload.passport_series = clientFormData.passport_series || "";
      payload.passport_number = clientFormData.passport_number || "";
      payload.registration_address = clientFormData.registration_address || "";
      payload.country = clientFormData.country || "";
      payload.trip_purpose = clientFormData.trip_purpose || "";
      payload.birth_date = clientFormData.birth_date || "";
      payload.birth_place = clientFormData.birth_place || "";
      payload.citizenship = clientFormData.citizenship || "";
      payload.sex = clientFormData.sex || "";
      payload.marital_status = clientFormData.marital_status || "";
      payload.passport_issue_date = clientFormData.passport_issue_date || "";
      payload.passport_expire_date = clientFormData.passport_expire_date || "";
      payload.previous_last_name = clientFormData.previous_last_name || "";
      payload.spouse_name = clientFormData.spouse_name || "";
      payload.spouse_contacts = clientFormData.spouse_contacts || "";
      payload.has_children = clientFormData.has_children || false;
      payload.children_list = clientFormData.children_list || "";
      payload.education = clientFormData.education || "";
      payload.job = clientFormData.job || "";
      payload.trips_last5_years = clientFormData.trips_last5_years || "";
      payload.relatives_in_destination = clientFormData.relatives_in_destination || "";
      payload.trusted_person = clientFormData.trusted_person || "";
      payload.height = clientFormData.height || 0;
      payload.weight = clientFormData.weight || 0;
      payload.driver_license_categories = clientFormData.driver_license_categories || "";
      payload.therapist_name = clientFormData.therapist_name || "";
      payload.clinic_name = clientFormData.clinic_name || "";
      payload.diseases_last3_years = clientFormData.diseases_last3_years || "";
      payload.additional_info = clientFormData.additional_info || "";
    }

    try {
      if (editingClient) {
        console.log('Updating existing client:', editingClient.id);
        console.log('Update payload:', payload);
        console.log('Update legal_profile:', payload.legal_profile);
        await ClientAPI.updateClientWithPhoto(editingClient.id.toString(), payload as any, selectedPhotoFile || undefined);
        toast({ title: "Успех", description: "Клиент успешно обновлен." });
      } else {
        console.log('Creating new client with payload:', payload);
        await ClientAPI.createClientWithPhoto(payload as any, selectedPhotoFile || undefined);
        toast({ title: "Успех", description: "Клиент успешно создан." });
      }
      void fetchClients(); // Refresh list
    } catch (err: any) {
      console.error("Form submit error", err);
      setError(err?.message || "Произошла ошибка.");
      toast({
        variant: "destructive",
        title: "Ошибка",
        description: err?.message || "Не удалось сохранить клиента.",
      });
    } finally {
      setIsFormOpen(false);
      resetForm();
    }
  };



  // Debug render state - only show when clients are empty
  if (clients.length === 0 && !isLoading) {
    console.log('=== RENDER DEBUG ===');
    console.log('Current clients state:', clients);
    console.log('Clients length:', clients.length);
    console.log('Is loading:', isLoading);
    console.log('Error state:', error);
  }

  return (
    <div className="flex flex-col gap-6 w-full p-6">
      {error && (
        <div className="p-3 rounded-md bg-red-50 border border-red-200 text-red-700">
          {error}
        </div>
      )}

      <div className="flex flex-wrap items-center justify-between gap-4 mb-6 animate-fade-in">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent">
            {clientView === "my" ? "Мои клиенты" : "Клиенты"}
          </h1>
          <p className="text-sm text-slate-600 mt-1">
            {clientView === "my" ? "Управление моими клиентами" : "Управление базой клиентов"}
          </p>
        </div>
        <div className="flex items-center gap-2">
            {/* View toggle - only show for non-sales users */}
            {user?.role !== 'sales' && (
              <CustomSelect
                value={clientView}
                onChange={(value) => setClientView(value as "all" | "my")}
                placeholder="Режим просмотра"
                options={[
                  { value: "all", label: "Все клиенты" },
                  { value: "my", label: "Мои клиенты" },
                ]}
              />
            )}
            <Button onClick={handleRefresh} variant="outline">
              <RefreshCw className="h-4 w-4 mr-2" />
              Обновить
            </Button>
            {canCreate && (
              <Button onClick={handleCreateClick} className="gradient-primary hover:opacity-90">
                <Plus className="h-4 w-4 mr-2" />
                Добавить клиента
              </Button>
            )}
          </div>
      </div>

      <Card className="mb-6 overflow-visible">
        <CardContent className="p-4 flex flex-col sm:flex-row gap-4 overflow-visible">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              placeholder="Введите данные для поиска..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <div className="flex items-center gap-2 flex-shrink-0 overflow-visible">
            <div className="w-48 relative overflow-visible">
              <CustomSelect
                value={clientTypeFilter}
                onChange={(value) => setClientTypeFilter(value)}
                placeholder="Тип клиента"
                options={[
                  { value: "", label: "Все типы" },
                  { value: "individual", label: "Физическое лицо" },
                  { value: "legal", label: "Юридическое лицо" },
                ]}
              />
            </div>
            {user?.role !== 'sales' && (
              <Button
                variant={clientView === "all" ? "secondary" : "outline"}
                onClick={() => setClientView("all")}
                className="whitespace-nowrap"
              >
                Все клиенты
              </Button>
            )}
            <Button
              variant={clientView === "my" ? "secondary" : "outline"}
              onClick={() => setClientView("my")}
              className="whitespace-nowrap"
            >
              Мои клиенты
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card className="overflow-visible">
        <CardHeader>
          <CardTitle>Список клиентов</CardTitle>
          <CardDescription>
            {clients?.length ? `Найдено ${clients.length} из ${totalClients} клиентов` : "Клиенты не найдены"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table className="animate-fade-in">
              <TableHeader>
                <TableRow>
                  <TableHead>Название/Имя</TableHead>
                  <TableHead>Тип клиента</TableHead>
                  <TableHead>БИН/ИИН</TableHead>
                  <TableHead>Контакт</TableHead>
                  <TableHead>Телефон</TableHead>
                  <TableHead className="text-right">Действия</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={6} className="h-24 text-center">
                      <Spinner />
                    </TableCell>
                  </TableRow>
                ) : (!clients || clients.length === 0) ? (
                  <TableRow>
                    <TableCell colSpan={6} className="h-24 text-center">
                      Клиенты не найдены.
                    </TableCell>
                  </TableRow>
                ) : (
                  clients.map((client) => (
                    <TableRow key={client.id}>
                      <TableCell className="font-medium">
                        {client.name ||
                          `${client.last_name} ${client.first_name}`}
                      </TableCell>
                      <TableCell>
                        <Badge variant={client.client_type === "legal" ? "default" : "secondary"}>
                          {client.client_type === "legal" ? "Юридическое лицо" : "Физическое лицо"}
                        </Badge>
                      </TableCell>
                      <TableCell>{client.bin_iin || client.iin || '-'}</TableCell>
                      <TableCell>
                        {client.client_type === "legal" ? (client.contact_info || '-') : `${client.last_name} ${client.first_name}`}
                      </TableCell>
                      <TableCell>{client.phone}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            title="Просмотр"
                            className="hover:bg-gray-100"
                            onClick={() => handleViewClick(client)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>

                          {canEdit && (
                            <Button
                              variant="ghost"
                              size="icon"
                              title="Редактировать"
                              className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                              onClick={() => handleEditClick(client)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                          )}

                          {canDelete && (
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  title="Удалить"
                                  className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                  onClick={() => handleDeleteClick(client)}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Вы уверены?</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Это действие приведет к удалению клиента. Эту операцию нельзя будет отменить.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel onClick={() => setClientToDelete(null)}>Отмена</AlertDialogCancel>
                                  <AlertDialogAction onClick={handleDeleteConfirm}>Удалить</AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {totalClients > limit && (
        <PaginationControls
          currentPage={currentPage}
          totalPages={Math.ceil(totalClients / limit)}
          onPageChange={handlePageChange}
        />
      )}

      {/* Modals */}
      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>{editingClient ? "Редактировать клиента" : "Создать нового клиента"}</DialogTitle>
            <DialogDescription>
              {editingClient ? "Внесите изменения в данные клиента." : "Заполните форму для создания нового клиента."}
            </DialogDescription>
          </DialogHeader>
          <ScrollArea className="max-h-[70vh] p-4">
            <div className="space-y-8">
              {/* Client Type */}
              <div className="space-y-2">
                <Label htmlFor="client_type">Тип лица *</Label>
                <CustomSelect
                  value={clientFormData.client_type || "individual"}
                  onChange={(value) => setClientFormData(prev => ({ ...prev, client_type: value }))}
                  options={[
                    { value: "individual", label: "Физическое лицо" },
                    { value: "legal", label: "Юридическое лицо" }
                  ]}
                  placeholder="Выберите тип лица..."
                  disabled={!!editingClient}
                />
                {editingClient && (
                  <p className="text-xs text-muted-foreground">Тип лица нельзя изменить после создания</p>
                )}
              </div>

              {/* Individual Client Fields */}
              {clientFormData.client_type === "individual" && (
                <>
                  {/* Country and Trip Purpose - FIRST */}
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="country">Страна *</Label>
                        <CustomSelect
                          value={clientFormData.country || ""}
                          onChange={(value) => setClientFormData(prev => ({ ...prev, country: value }))}
                          options={[
                            { value: "south_korea", label: "Южная Корея" },
                            { value: "japan", label: "Япония" },
                            { value: "usa", label: "США" },
                            { value: "uk", label: "Великобритания" },
                            { value: "australia", label: "Австралия" },
                            { value: "canada", label: "Канада" },
                            { value: "poland", label: "Польша" },
                            { value: "estonia", label: "Эстония" },
                            { value: "lithuania", label: "Литва" },
                            { value: "slovakia", label: "Словакия" },
                            { value: "germany", label: "Германия" },
                            { value: "italy", label: "Италия" },
                            { value: "spain", label: "Испания" },
                            { value: "czech_republic", label: "Чехия" },
                            { value: "norway", label: "Норвегия" },
                            { value: "sweden", label: "Швеция" },
                            { value: "france", label: "Франция" },
                            { value: "other", label: "Другая страна..." }
                          ]}
                          placeholder="Выберите страну..."
                        />
                        {clientFormData.country === "other" && (
                          <Input
                            id="country_other"
                            placeholder="Укажите страну..."
                            value={clientFormData.country_other || ""}
                            onChange={handleFormChange}
                          />
                        )}
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="trip_purpose">Цель поездки *</Label>
                        <CustomSelect
                          value={clientFormData.trip_purpose || ""}
                          onChange={(value) => setClientFormData(prev => ({ ...prev, trip_purpose: value }))}
                          options={[
                            { value: "tourism", label: "Туризм" },
                            { value: "business", label: "Бизнес" },
                            { value: "study", label: "Учеба" },
                            { value: "work", label: "Работа" },
                            { value: "family_visit", label: "Посещение семьи/друзей" },
                            { value: "medical", label: "Лечение" },
                            { value: "residence_permit", label: "ВНЖ" },
                            { value: "permanent_residence", label: "ПМЖ" },
                            { value: "transit", label: "Транзит" },
                            { value: "other", label: "Другая цель..." }
                          ]}
                          placeholder="Выберите цель..."
                        />
                        {clientFormData.trip_purpose === "other" && (
                          <Input
                            id="trip_purpose_other"
                            placeholder="Укажите цель..."
                            value={clientFormData.trip_purpose_other || ""}
                            onChange={handleFormChange}
                          />
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Personal Data Section */}
                  <div className="space-y-4 border-t pt-4">
                    <h3 className="font-semibold text-lg">ЛИЧНЫЕ ДАННЫЕ</h3>
                    <Separator />
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="last_name">Фамилия *</Label>
                        <Input id="last_name" placeholder="Фамилия" value={clientFormData.last_name || ""} onChange={handleFormChange} />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="first_name">Имя *</Label>
                        <Input id="first_name" placeholder="Имя" value={clientFormData.first_name || ""} onChange={handleFormChange} />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="middle_name">Отчество (если имеется)</Label>
                        <Input id="middle_name" placeholder="Отчество" value={clientFormData.middle_name || ""} onChange={handleFormChange} />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="previous_last_name">Прежняя фамилия</Label>
                        <Input id="previous_last_name" placeholder="Прежняя фамилия" value={clientFormData.previous_last_name || ""} onChange={handleFormChange} />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="birth_date">Дата рождения *</Label>
                        <Input id="birth_date" type="date" value={clientFormData.birth_date || ""} onChange={handleFormChange} />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="sex">Пол *</Label>
                        <CustomSelect
                          value={clientFormData.sex || ""}
                          onChange={(value) => setClientFormData(prev => ({ ...prev, sex: value }))}
                          options={[
                            { value: "male", label: "Мужской" },
                            { value: "female", label: "Женский" }
                          ]}
                          placeholder="Выберите пол..."
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="citizenship">Гражданство *</Label>
                        <Input id="citizenship" placeholder="Гражданство" value={clientFormData.citizenship || ""} onChange={handleFormChange} />
                      </div>
                      <div className="space-y-2 md:col-span-2">
                        <Label htmlFor="birth_place">Место рождения</Label>
                        <Input id="birth_place" placeholder="Место рождения" value={clientFormData.birth_place || ""} onChange={handleFormChange} />
                      </div>
                    </div>
                  </div>

                  {/* Documents Section */}
                  <div className="space-y-4 border-t pt-4">
                    <h3 className="font-semibold text-lg">ДОКУМЕНТЫ</h3>
                    <Separator />
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="iin">ИИН</Label>
                        <Input id="iin" placeholder="ИИН" value={clientFormData.iin || ""} onChange={handleFormChange} />
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="id_number">Номер удостоверения личности</Label>
                          <Input id="id_number" placeholder="Номер" value={clientFormData.id_number || ""} onChange={handleFormChange} />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="id_issue_date">Дата выдачи</Label>
                          <Input id="id_issue_date" type="date" value={clientFormData.id_issue_date || ""} onChange={handleFormChange} />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="id_expire_date">Дата окончания</Label>
                          <Input id="id_expire_date" type="date" value={clientFormData.id_expire_date || ""} onChange={handleFormChange} />
                        </div>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="passport_series">Серия паспорта</Label>
                          <Input id="passport_series" placeholder="Серия" value={clientFormData.passport_series || ""} onChange={handleFormChange} />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="passport_number">Номер паспорта</Label>
                          <Input id="passport_number" placeholder="Номер" value={clientFormData.passport_number || ""} onChange={handleFormChange} />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="passport_issue_date">Дата выдачи паспорта</Label>
                          <Input id="passport_issue_date" type="date" value={clientFormData.passport_issue_date || ""} onChange={handleFormChange} />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="passport_expire_date">Дата окончания паспорта</Label>
                          <Input id="passport_expire_date" type="date" value={clientFormData.passport_expire_date || ""} onChange={handleFormChange} />
                        </div>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="driver_license_number">Серия и номер водительского удостоверения</Label>
                          <Input id="driver_license_number" placeholder="Серия и номер" value={clientFormData.driver_license_number || ""} onChange={handleFormChange} />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="driver_license_issue_date">Дата выдачи</Label>
                          <Input id="driver_license_issue_date" type="date" value={clientFormData.driver_license_issue_date || ""} onChange={handleFormChange} />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="driver_license_expire_date">Дата окончания</Label>
                          <Input id="driver_license_expire_date" type="date" value={clientFormData.driver_license_expire_date || ""} onChange={handleFormChange} />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Marital Status Section */}
                  <div className="space-y-4 border-t pt-4">
                    <h3 className="font-semibold text-lg">СЕМЕЙНОЕ ПОЛОЖЕНИЕ</h3>
                    <Separator />
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="marital_status">Гражданское состояние</Label>
                          <CustomSelect
                            value={clientFormData.marital_status || ""}
                            onChange={(value) => setClientFormData(prev => ({ ...prev, marital_status: value }))}
                            options={[
                              { value: "married", label: "В браке" },
                              { value: "not_married", label: "Не в браке" },
                              { value: "divorced", label: "В разводе" },
                              { value: "widowed", label: "Вдова/Вдовец" },
                              { value: "civil_marriage", label: "Гражданский брак" }
                            ]}
                            placeholder="Выберите статус..."
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="has_children">Есть ли дети</Label>
                          <CustomSelect
                            value={clientFormData.has_children ? "true" : "false"}
                            onChange={(value) => handleBooleanChange("has_children", value)}
                            options={[{ value: "true", label: "Да" }, { value: "false", label: "Нет" }]}
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="spouse_name">ФИО супруга(и)</Label>
                          <Input id="spouse_name" placeholder="ФИО" value={clientFormData.spouse_name || ""} onChange={handleFormChange} />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="spouse_contacts">Телефон супруга(и)</Label>
                          <Input id="spouse_contacts" placeholder="Телефон" value={clientFormData.spouse_contacts || ""} onChange={handleFormChange} />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="children_list">Дети</Label>
                        <Textarea id="children_list" placeholder="Информация о детях..." value={clientFormData.children_list || ""} onChange={handleFormChange} rows={2} />
                      </div>
                    </div>
                  </div>

                  {/* Trusted Person Section */}
                  <div className="space-y-4 border-t pt-4">
                    <h3 className="font-semibold text-lg">ДОВЕРЕННОЕ ЛИЦО</h3>
                    <Separator />
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="trusted_person">ФИО доверенного лица</Label>
                        <Input id="trusted_person" placeholder="ФИО" value={clientFormData.trusted_person || ""} onChange={handleFormChange} />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="trusted_person_phone">Телефон доверенного лица</Label>
                        <Input id="trusted_person_phone" placeholder="Телефон" value={clientFormData.trusted_person_phone || ""} onChange={handleFormChange} />
                      </div>
                    </div>
                  </div>

                  {/* Contacts and Address Section */}
                  <div className="space-y-4 border-t pt-4">
                    <h3 className="font-semibold text-lg">КОНТАКТЫ И АДРЕС</h3>
                    <Separator />
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="registration_address">Адрес прописки</Label>
                        <Textarea id="registration_address" placeholder="Адрес прописки" value={clientFormData.registration_address || ""} onChange={handleFormChange} rows={2} />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="residential_address">Адрес проживания</Label>
                        <Textarea id="residential_address" placeholder="Адрес проживания" value={clientFormData.residential_address || ""} onChange={handleFormChange} rows={2} />
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="phone">Телефон *</Label>
                          <Input id="phone" placeholder="Телефон" value={clientFormData.phone || ""} onChange={handleFormChange} />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="email">Email</Label>
                          <Input id="email" type="email" placeholder="Email" value={clientFormData.email || ""} onChange={handleFormChange} />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Work and Education Section */}
                  <div className="space-y-4 border-t pt-4">
                    <h3 className="font-semibold text-lg">РАБОТА И ОБРАЗОВАНИЕ</h3>
                    <Separator />
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="education_level">Образование</Label>
                          <CustomSelect
                            value={clientFormData.education_level || ""}
                            onChange={(value) => setClientFormData(prev => ({ ...prev, education_level: value }))}
                            options={[
                              { value: "higher", label: "Высшее" },
                              { value: "secondary_special", label: "Средне-специальное" },
                              { value: "secondary", label: "Среднее" },
                              { value: "primary", label: "Начальное" },
                              { value: "incomplete_higher", label: "Неоконченное высшее" }
                            ]}
                            placeholder="Выберите уровень образования..."
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="specialty">Специальность</Label>
                          <Input id="specialty" placeholder="Специальность" value={clientFormData.specialty || ""} onChange={handleFormChange} />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="education_institution">Название учебного заведения</Label>
                        <Input id="education_institution" placeholder="Название учебного заведения" value={clientFormData.education_institution || ""} onChange={handleFormChange} />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="education_institution_address">Адрес учебного заведения</Label>
                        <Textarea id="education_institution_address" placeholder="Адрес учебного заведения" value={clientFormData.education_institution_address || ""} onChange={handleFormChange} rows={2} />
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="job">Место работы</Label>
                          <Input id="job" placeholder="Место работы" value={clientFormData.job || ""} onChange={handleFormChange} />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="position">Должность</Label>
                          <Input id="position" placeholder="Должность" value={clientFormData.position || ""} onChange={handleFormChange} />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="education">Образование (текст)</Label>
                        <Input id="education" placeholder="Дополнительная информация об образовании" value={clientFormData.education || ""} onChange={handleFormChange} />
                      </div>
                    </div>
                  </div>

                  {/* Visa History Section */}
                  <div className="space-y-4 border-t pt-4">
                    <h3 className="font-semibold text-lg">ВИЗОВАЯ ИСТОРИЯ</h3>
                    <Separator />
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="trips_last5_years">Поездки за последние 5 лет</Label>
                        <Textarea id="trips_last5_years" placeholder="Перечислите страны и даты поездок" value={clientFormData.trips_last5_years || ""} onChange={handleFormChange} rows={3} />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="visas_received">Полученные визы</Label>
                        <Textarea id="visas_received" placeholder="Перечислите полученные визы" value={clientFormData.visas_received || ""} onChange={handleFormChange} rows={2} />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="visa_refusals">Отказы в визах</Label>
                        <Textarea id="visa_refusals" placeholder="Были ли отказы в визах? Если да, укажите детали" value={clientFormData.visa_refusals || ""} onChange={handleFormChange} rows={2} />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="relatives_in_destination">Члены семьи за рубежом</Label>
                        <Textarea id="relatives_in_destination" placeholder="ФИО членов семьи, проживающих за рубежом" value={clientFormData.relatives_in_destination || ""} onChange={handleFormChange} rows={2} />
                      </div>
                    </div>
                  </div>

                  {/* Medical Information Section */}
                  <div className="space-y-4 border-t pt-4">
                    <h3 className="font-semibold text-lg">МЕДИЦИНСКАЯ ИНФОРМАЦИЯ</h3>
                    <Separator />
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="height">Рост</Label>
                        <Input id="height" type="number" placeholder="Рост (см)" value={clientFormData.height || ""} onChange={handleFormChange} />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="weight">Вес</Label>
                        <Input id="weight" type="number" placeholder="Вес (кг)" value={clientFormData.weight || ""} onChange={handleFormChange} />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="therapist_name">ФИО терапевта</Label>
                        <Input id="therapist_name" placeholder="ФИО" value={clientFormData.therapist_name || ""} onChange={handleFormChange} />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="clinic_name">Название клиники</Label>
                        <Input id="clinic_name" placeholder="Название клиники" value={clientFormData.clinic_name || ""} onChange={handleFormChange} />
                      </div>
                      <div className="space-y-2 md:col-span-2">
                        <Label htmlFor="diseases_last3_years">Болезни / травмы за последние 5 лет</Label>
                        <Textarea id="diseases_last3_years" placeholder="Укажите перенесенные болезни или травмы" value={clientFormData.diseases_last3_years || ""} onChange={handleFormChange} rows={2} />
                      </div>
                      <div>
                        <Label htmlFor="driver_license_categories">Категории водительских прав</Label>
                        <Input id="driver_license_categories" placeholder="Категории..." value={clientFormData.driver_license_categories || ""} onChange={handleFormChange} />
                      </div>
                    </div>
                  </div>
                </>
              )}

              {/* Legal Entity Information - shown only for legal clients */}
              {clientFormData.client_type === "legal" && (
                <div className="space-y-4">
                  <h3 className="font-semibold text-lg flex items-center gap-2">
                    <Building className="h-5 w-5" />
                    Информация о юридическом лице
                  </h3>
                  <Separator />
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <div>
                      <Label htmlFor="name" className="text-red-600">Название компании *</Label>
                      <Input id="name" placeholder="Введите название компании..." value={clientFormData.name || ""} onChange={handleFormChange} />
                    </div>
                    <div>
                      <Label htmlFor="bin_iin" className="text-red-600">БИН *</Label>
                      <Input id="bin_iin" placeholder="Введите БИН..." value={clientFormData.bin_iin || ""} onChange={handleFormChange} />
                    </div>
                    <div>
                      <Label htmlFor="address" className="text-red-600">Юридический адрес *</Label>
                      <Input id="address" placeholder="Введите юридический адрес..." value={clientFormData.address || ""} onChange={handleFormChange} />
                    </div>
                    <div>
                      <Label htmlFor="contact_info" className="text-red-600">Контактное лицо (ФИО) *</Label>
                      <Input id="contact_info" placeholder="ФИО контактного лица..." value={clientFormData.contact_info || ""} onChange={handleFormChange} />
                    </div>
                    <div>
                      <Label htmlFor="contact_person_position">Должность подписанта</Label>
                      <Input id="contact_person_position" placeholder="Должность..." value={clientFormData.contact_person_position || ""} onChange={handleFormChange} />
                    </div>
                    <div>
                      <Label htmlFor="phone" className="text-red-600">Телефон контактного лица *</Label>
                      <Input id="phone" placeholder="+7 (___) ___-__-__" value={clientFormData.phone || ""} onChange={handleFormChange} />
                    </div>
                    <div>
                      <Label htmlFor="bank_name">Название банка</Label>
                      <Input id="bank_name" placeholder="Название банка..." value={clientFormData.bank_name || ""} onChange={handleFormChange} />
                    </div>
                    <div>
                      <Label htmlFor="iban">IBAN</Label>
                      <Input id="iban" placeholder="IBAN..." value={clientFormData.iban || ""} onChange={handleFormChange} />
                    </div>
                    <div>
                      <Label htmlFor="bik">БИК</Label>
                      <Input id="bik" placeholder="БИК..." value={clientFormData.bik || ""} onChange={handleFormChange} />
                    </div>
                    <div>
                      <Label htmlFor="kbe">КБЕ</Label>
                      <Input id="kbe" placeholder="КБЕ..." value={clientFormData.kbe || ""} onChange={handleFormChange} />
                    </div>
                    <div className="md:col-span-2 lg:col-span-3">
                      <Label htmlFor="additional_info">Дополнительная информация</Label>
                      <Textarea id="additional_info" placeholder="Комментарии и заметки..." value={clientFormData.additional_info || ""} onChange={handleFormChange} rows={3} />
                    </div>
                  </div>
                </div>
              )}

              {/* Photo upload for individual clients */}
              {clientFormData.client_type === "individual" && (
                <div className="space-y-4 border-t pt-4">
                  <h3 className="font-semibold text-lg">ФОТО</h3>
                  <Separator />
                  <div className="space-y-2">
                    <Label htmlFor="photo_35x45">Фото 3,5x4,5</Label>
                    <div className="space-y-2">
                      {photoPreview ? (
                        <div className="relative">
                          <img 
                            src={photoPreview} 
                            alt="Preview" 
                            className="w-32 h-40 object-cover rounded border border-gray-200"
                          />
                          <Button
                            type="button"
                            variant="destructive"
                            size="sm"
                            className="absolute top-1 right-1 h-6 w-6 p-0"
                            onClick={clearPhoto}
                          >
                            ×
                          </Button>
                        </div>
                      ) : (
                        <div className="border-2 border-dashed border-gray-300 rounded-lg p-4">
                          <div className="text-center">
                            <div className="text-gray-400 mb-2">
                              <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                              </svg>
                            </div>
                            <div className="text-sm text-gray-600">
                              <label htmlFor="photo-upload" className="cursor-pointer text-blue-600 hover:text-blue-500">
                                Выберите фото
                              </label>
                              {' '}
                              или перетащите файл сюда
                            </div>
                            <p className="text-xs text-gray-500">JPG, JPEG, PNG до 5 МБ</p>
                          </div>
                          <input
                            id="photo-upload"
                            type="file"
                            className="hidden"
                            accept=".jpg,.jpeg,.png"
                            onChange={handlePhotoSelect}
                          />
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </ScrollArea>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsFormOpen(false)}>Отмена</Button>
            <Button onClick={handleSubmit}>Сохранить</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <Dialog open={!!viewingClient} onOpenChange={(isOpen) => {
        if (!isOpen) {
          setViewingClient(null);
          setClientProfile(null);
          // Clean up blob URL to prevent memory leaks
          if (clientPhotoUrl) {
            URL.revokeObjectURL(clientPhotoUrl);
          }
          setClientPhotoUrl(null);
        }
      }}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{viewingClient?.name || `${viewingClient?.last_name} ${viewingClient?.first_name}`}</DialogTitle>
            <DialogDescription>Детальная информация о клиенте</DialogDescription>
          </DialogHeader>
          {viewingClient && (
            <ScrollArea className="max-h-[70vh] p-4">
              <div className="space-y-6">
                {/* Photo Section */}
                {clientProfile?.files?.photo35x45?.exists && (
                  <div>
                    <h3 className="font-semibold text-lg mb-2 flex items-center gap-2">
                      <FileText className="h-5 w-5" />
                      Фото клиента
                    </h3>
                    <div className="flex items-center gap-4">
                      {clientPhotoUrl ? (
                        <img 
                          src={clientPhotoUrl}
                          alt="Client Photo" 
                          className="w-32 h-40 object-cover rounded border border-gray-200"
                          onLoad={() => {
                            console.log('Client photo loaded successfully');
                          }}
                          onError={(e) => {
                            console.error('Failed to load client photo:', e);
                          }}
                        />
                      ) : (
                        <div className="w-32 h-40 bg-gray-100 rounded border border-gray-200 flex items-center justify-center">
                          <span className="text-gray-500 text-sm">Загрузка...</span>
                        </div>
                      )}
                      <div className="space-y-2">
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => {
                            const link = document.createElement('a');
                            link.href = `/api-proxy/clients/${viewingClient?.id}/files/primary/download?category=photo35x45`;
                            link.download = `client_${viewingClient?.id}_photo.jpg`;
                            document.body.appendChild(link);
                            link.click();
                            document.body.removeChild(link);
                          }}
                        >
                          <Download className="h-4 w-4 mr-2" />
                          Скачать фото
                        </Button>
                      </div>
                    </div>
                  </div>
                )}
                {clientProfile?.files?.photo35x45?.exists && <Separator />}
                {/* Required Fields */}
                <div>
                  <h3 className="font-semibold text-lg mb-2 text-red-600 flex items-center gap-2">
                    <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                    Обязательные поля
                  </h3>
                  <div className="grid grid-cols-2 gap-4">
                    <DetailItem label="Тип клиента" value={viewingClient.client_type === "legal" ? "Юридическое лицо" : "Физическое лицо"} />
                    {viewingClient.client_type !== "legal" && (
                      <>
                        <DetailItem label="Страна" value={viewingClient.country} />
                        <DetailItem label="Цель поездки" value={viewingClient.trip_purpose} />
                      </>
                    )}
                    {viewingClient.client_type !== "legal" && (
                      <>
                        <DetailItem label="Фамилия" value={viewingClient.last_name} />
                        <DetailItem label="Имя" value={viewingClient.first_name} />
                        <DetailItem label="Дата рождения" value={viewingClient.birth_date} />
                      </>
                    )}
                    <DetailItem label="Телефон" value={viewingClient.phone} />
                  </div>
                </div>
                <Separator />

                {/* Personal Information - only for individual clients */}
                {viewingClient.client_type !== "legal" && (
                  <>
                    <div>
                      <h3 className="font-semibold text-lg mb-2 flex items-center gap-2">
                        <UserIcon className="h-5 w-5" />
                        Персональная информация
                      </h3>
                      <div className="grid grid-cols-2 gap-4">
                        <DetailItem label="Отчество" value={viewingClient.middle_name} />
                        <DetailItem label="Место рождения" value={viewingClient.birth_place} />
                        <DetailItem label="Гражданство" value={viewingClient.citizenship} />
                        <DetailItem label="Пол" value={viewingClient.sex} />
                        <DetailItem label="Гражданское состояние" value={viewingClient.marital_status} />
                        <DetailItem label="ИИН" value={viewingClient.iin} />
                      </div>
                    </div>
                    <Separator />
                  </>
                )}

                {/* Document Information - only for individual clients */}
                {viewingClient.client_type !== "legal" && (
                  <>
                    <div>
                      <h3 className="font-semibold text-lg mb-2 flex items-center gap-2">
                        <CreditCard className="h-5 w-5" />
                        Документы
                      </h3>
                      <div className="grid grid-cols-2 gap-4">
                        <DetailItem label="Номер удостоверения" value={viewingClient.id_number} />
                        <DetailItem label="Серия паспорта" value={viewingClient.passport_series} />
                        <DetailItem label="Номер паспорта" value={viewingClient.passport_number} />
                        <DetailItem label="Дата выдачи паспорта" value={viewingClient.passport_issue_date} />
                        <DetailItem label="Дата окончания паспорта" value={viewingClient.passport_expire_date} />
                        <DetailItem label="Фото 3,5x4,5" value={viewingClient.photo_35x45} />
                      </div>
                    </div>
                    <Separator />
                  </>
                )}
                
                {/* Contact Information */}
                <div>
                  <h3 className="font-semibold text-lg mb-2 flex items-center gap-2">
                    <Phone className="h-5 w-5" />
                    Контактная информация
                  </h3>
                  <div className="grid grid-cols-2 gap-4">
                    <DetailItem label="Email" value={viewingClient.email} />
                    <DetailItem label="Адрес прописки" value={viewingClient.registration_address} />
                    <DetailItem label="Адрес проживания" value={viewingClient.actual_address} />
                  </div>
                </div>
                <Separator />

                {/* Additional Information - only for individual clients */}
                {viewingClient.client_type !== "legal" && (
                  <>
                    <div>
                      <h3 className="font-semibold text-lg mb-2 flex items-center gap-2">
                        <FileText className="h-5 w-5" />
                        Дополнительная информация
                      </h3>
                      <div className="grid grid-cols-2 gap-4">
                        <DetailItem label="Прежняя фамилия (девичья)" value={viewingClient.previous_last_name} />
                        <DetailItem label="Супруг(а)" value={viewingClient.spouse_name} />
                        <DetailItem label="Контакты супруга(и)" value={viewingClient.spouse_contacts} />
                        <DetailItem label="Есть дети" value={viewingClient.has_children ? "Да" : "Нет"} />
                        <DetailItem label="Дети" value={viewingClient.children_list} />
                        <DetailItem label="Образование" value={viewingClient.education} />
                        <DetailItem label="Место работы и должность" value={viewingClient.job} />
                        <DetailItem label="Поездки и визы за 5 лет" value={viewingClient.trips_last5_years} />
                        <DetailItem label="Члены семьи за рубежом" value={viewingClient.relatives_in_destination} />
                        <DetailItem label="Доверенное лицо" value={viewingClient.trusted_person} />
                        <DetailItem label="Рост" value={viewingClient.height?.toString()} />
                        <DetailItem label="Вес" value={viewingClient.weight?.toString()} />
                        <DetailItem label="Права ВУ" value={viewingClient.driver_license_categories} />
                        <DetailItem label="Терапевт" value={viewingClient.therapist_name} />
                        <DetailItem label="Клиника" value={viewingClient.clinic_name} />
                        <DetailItem label="Заболевания / Травмы" value={viewingClient.diseases_last3_years} />
                        <DetailItem label="Дополнительная информация" value={viewingClient.additional_info} />
                      </div>
                    </div>
                    <Separator />
                  </>
                )}
                
                {/* Organization Information - only for legal clients */}
                {viewingClient.client_type === "legal" && (
                  <div>
                    <h3 className="font-semibold text-lg mb-2 flex items-center gap-2">
                      <Briefcase className="h-5 w-5" />
                      Информация об организации
                    </h3>
                    <div className="grid grid-cols-2 gap-4">
                      <DetailItem label="Название" value={viewingClient.name} />
                      <DetailItem label="БИН/ИИН" value={viewingClient.bin_iin} />
                      <DetailItem label="Организационно-правовая форма" value={viewingClient.legal_profile?.legal_form} />
                      <DetailItem label="ФИО директора" value={viewingClient.legal_profile?.director_full_name} />
                      <DetailItem label="Контактное лицо" value={viewingClient.contact_info} />
                      <DetailItem label="Должность контактного лица" value={viewingClient.contact_person_position} />
                      <DetailItem label="Юридический адрес" value={viewingClient.address} />
                      <DetailItem label="Фактический адрес" value={viewingClient.actual_address} />
                      <DetailItem label="Название банка" value={viewingClient.bank_name} />
                      <DetailItem label="IBAN" value={viewingClient.iban} />
                      <DetailItem label="БИК" value={viewingClient.bik} />
                      <DetailItem label="КБЕ" value={viewingClient.kbe} />
                      <DetailItem label="Налоговый режим" value={viewingClient.legal_profile?.tax_regime} />
                      <DetailItem label="Веб-сайт" value={viewingClient.legal_profile?.website} />
                      <DetailItem label="Отрасль" value={viewingClient.legal_profile?.industry} />
                      <DetailItem label="Размер компании" value={viewingClient.legal_profile?.company_size} />
                      <DetailItem label="Дополнительная информация" value={viewingClient.legal_profile?.additional_info} />
                    </div>
                  </div>
                )}
              </div>
            </ScrollArea>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setViewingClient(null)}>Закрыть</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}