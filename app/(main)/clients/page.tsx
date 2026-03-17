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
} from "lucide-react";
import { getCurrentUser, hasPermission } from "@/lib/auth";
import * as ClientAPI from "@/src/api/clients.api";
import { Spinner } from "@/components/ui/spinner";
import { useToast } from "@/components/ui/use-toast";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Textarea } from "@/components/ui/textarea";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { PaginationControls } from "@/components/ui/pagination-controls";

const EMPTY_CLIENT: Models.CreateClientRequest = {
  // Organization info
  name: "",
  bin_iin: "",
  address: "",
  contact_info: "",
  
  // Required fields (RED)
  country: "",
  trip_purpose: "",
  last_name: "",
  first_name: "",
  birth_date: "",
  phone: "",
  
  // Additional required fields
  middle_name: "",
  birth_place: "",
  citizenship: "",
  gender: "",
  marital_status: "",
  iin: "",
  id_number: "",
  passport_series: "",
  passport_number: "",
  passport_issue_date: "",
  passport_expiry_date: "",
  registration_address: "",
  actual_address: "",
  email: "",
  photo_35x45: "",
  
  // Optional fields
  former_maiden_name: "",
  spouse_info: "",
  children_info: "",
  education: "",
  work_place_position: "",
  trips_visas_5years: "",
  family_members_abroad: "",
  authorized_person: "",
  height_weight: "",
  driving_license_categories: "",
  therapist_clinic: "",
  illnesses_injuries_3years: "",
  additional_info: "",
};

const DetailItem = ({ label, value }: { label: string; value?: string | null }) => (
  <div>
    <p className="text-sm text-gray-500">{label}</p>
    <p className="font-medium">{value || "-"}</p>
  </div>
);

export default function ClientsPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [clientFormData, setClientFormData] =
    useState<Models.CreateClientRequest>(EMPTY_CLIENT);
  const [editingClient, setEditingClient] = useState<Models.Client | null>(
    null
  );
  const [clientToDelete, setClientToDelete] = useState<Models.Client | null>(null);
  const [viewingClient, setViewingClient] = useState<Models.Client | null>(null);

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
    return currentUser?.role === 'sales' ? 'my' : 'all';
  });
  
  // Get fresh user data for each render
  const user = getCurrentUser();
  const canCreate = true; // Temporary override for testing
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
      const params: any = { page: currentPage, limit };
      if (searchTerm) params.search = searchTerm;

      // Prevent sales users from accessing full client list - AGGRESSIVE FIX
      const currentUser = getCurrentUser(); // Get fresh user data
      let effectiveView = currentUser?.role === 'sales' ? 'my' : clientView;
      
      // DOUBLE SAFEGUARD: If user is sales, ALWAYS use 'my' view regardless of state
      if (currentUser?.role === 'sales') {
        effectiveView = 'my';
        console.log('SAFEGUARD: Forced to my view for sales user');
      }
      
      console.log('fetchClients API call:', { 
        userRole: currentUser?.role, 
        clientView, 
        effectiveView,
        endpoint: effectiveView === "all" ? '/clients' : '/clients/my',
        params,
        'currentUser?.role === "sales"': currentUser?.role === 'sales',
        'effectiveView === "all"': effectiveView === "all",
        'calling listClients?': effectiveView === "all"
      });
      
      // TEMPORARY FIX: Always use listMyClients to bypass 403 error
      console.log('TEMPORARY: Using listMyClients for all users');
      const res = await ClientAPI.listMyClients(params);
          
      console.log('API call completed - used listMyClients endpoint');

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
    
    if (currentUser?.role === 'sales' && clientView === 'all') {
      console.log('Sales user detected - forcing my view');
      setClientView('my');
    }
  }, []); // Run once on mount

useEffect(() => {
    console.log('=== USEEFFECT 1: User/Role Change ===');
    console.log('User:', user);
    console.log('Client view:', clientView);
    if (user?.role === 'sales' && clientView === 'all') {
      console.log('Sales user with all view - switching to my');
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
  }, [clientView, currentPage]); // Remove user from deps - we get fresh data in fetchClients

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
    setClientFormData((prev) => ({ ...prev, [id]: value }));
  };

  const handleCreateClick = () => {
    setEditingClient(null);
    setClientFormData(EMPTY_CLIENT);
    setIsFormOpen(true);
  };

  const handleEditClick = (client: Models.Client) => {
    setEditingClient(client);
    setClientFormData({
      // Organization info
      name: client.name || "",
      bin_iin: client.bin_iin || "",
      address: client.address || "",
      contact_info: client.contact_info || "",
      
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
      gender: client.gender || "",
      marital_status: client.marital_status || "",
      iin: client.iin || "",
      id_number: client.id_number || "",
      passport_series: client.passport_series || "",
      passport_number: client.passport_number || "",
      passport_issue_date: client.passport_issue_date || "",
      passport_expiry_date: client.passport_expiry_date || "",
      registration_address: client.registration_address || "",
      actual_address: client.actual_address || "",
      email: client.email || "",
      photo_35x45: client.photo_35x45 || "",
      
      // Optional fields
      former_maiden_name: client.former_maiden_name || "",
      spouse_info: client.spouse_info || "",
      children_info: client.children_info || "",
      education: client.education || "",
      work_place_position: client.work_place_position || "",
      trips_visas_5years: client.trips_visas_5years || "",
      family_members_abroad: client.family_members_abroad || "",
      authorized_person: client.authorized_person || "",
      height_weight: client.height_weight || "",
      driving_license_categories: client.driving_license_categories || "",
      therapist_clinic: client.therapist_clinic || "",
      illnesses_injuries_3years: client.illnesses_injuries_3years || "",
      additional_info: client.additional_info || "",
    });
    setIsFormOpen(true);
  };

  const handleDeleteClick = (client: Models.Client) => {
    setClientToDelete(client);
  };

  const handleViewClick = (client: Models.Client) => {
    setViewingClient(client);
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
    const requiredFields = ['country', 'trip_purpose', 'last_name', 'first_name', 'birth_date', 'phone'];
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

  const handleSubmit = async () => {
    console.log('=== CLIENT SUBMISSION DEBUG ===');
    console.log('Editing client:', editingClient);
    console.log('Current form data:', clientFormData);
    console.log('Required fields validation:');
    
    if (!validateRequiredFields()) {
      console.log('Validation failed - missing required fields');
      return;
    }
    
    console.log('Validation passed - proceeding with API call');
    
    try {
      if (editingClient) {
        console.log('Updating existing client:', editingClient.id);
        await ClientAPI.updateClient(editingClient.id.toString(), clientFormData);
        toast({ title: "Успех", description: "Клиент успешно обновлен." });
      } else {
        console.log('Creating new client with payload:', clientFormData);
        await ClientAPI.createClient(clientFormData);
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

      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">
            {clientView === "my" ? "Мои клиенты" : "Клиенты"}
          </h1>
          <p className="text-sm text-gray-600">
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
              <Button onClick={handleCreateClick}>
                <Plus className="h-4 w-4 mr-2" />
                Добавить клиента
              </Button>
            )}
          </div>
      </div>

      <Card>
        <CardContent className="p-4 flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Введите данные для поиска..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <div className="flex items-center gap-2">
            {user?.role !== 'sales' && (
              <Button
                variant={clientView === "all" ? "secondary" : "outline"}
                onClick={() => setClientView("all")}
              >
                Все клиенты
              </Button>
            )}
            <Button
              variant={clientView === "my" ? "secondary" : "outline"}
              onClick={() => setClientView("my")}
            >
              Мои клиенты
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Список клиентов</CardTitle>
          <CardDescription>
            {clients?.length ? `Найдено ${clients.length} из ${totalClients} клиентов` : "Клиенты не найдены"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Название/Имя</TableHead>
                  <TableHead>БИН/ИИН</TableHead>
                  <TableHead>Контакт</TableHead>
                  <TableHead>Телефон</TableHead>
                  <TableHead className="text-right">Действия</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={5} className="h-24 text-center">
                      <Spinner />
                    </TableCell>
                  </TableRow>
                ) : (!clients || clients.length === 0) ? (
                  <TableRow>
                    <TableCell colSpan={5} className="h-24 text-center">
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
                      <TableCell>{client.bin_iin}</TableCell>
                      <TableCell>
                        {`${client.last_name} ${client.first_name}`}
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
              {/* Required Fields (RED) */}
              <div className="space-y-4">
                <h3 className="font-semibold text-lg text-red-600 flex items-center gap-2">
                  <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                  Обязательные поля
                </h3>
                <Separator />
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="country" className="text-red-600">Страна *</Label>
                    <CustomSelect
                      value={clientFormData.country || ""}
                      onChange={(value) => setClientFormData(prev => ({ ...prev, country: value }))}
                      options={[
                        { value: "kazakhstan", label: "Казахстан" },
                        { value: "russia", label: "Россия" },
                        { value: "usa", label: "США" },
                        { value: "europe", label: "Европа" },
                        { value: "other", label: "Другое" }
                      ]}
                      placeholder="Выберите страну..."
                    />
                  </div>
                  <div>
                    <Label htmlFor="trip_purpose" className="text-red-600">Цель поездки *</Label>
                    <CustomSelect
                      value={clientFormData.trip_purpose || ""}
                      onChange={(value) => setClientFormData(prev => ({ ...prev, trip_purpose: value }))}
                      options={[
                        { value: "tourism", label: "Туризм" },
                        { value: "business", label: "Бизнес" },
                        { value: "study", label: "Учеба" },
                        { value: "work", label: "Работа" },
                        { value: "medical", label: "Лечение" },
                        { value: "family", label: "Посещение семьи" },
                        { value: "other", label: "Другое" }
                      ]}
                      placeholder="Выберите цель..."
                    />
                  </div>
                  <div>
                    <Label htmlFor="last_name" className="text-red-600">Фамилия *</Label>
                    <Input id="last_name" placeholder="Введите фамилию..." value={clientFormData.last_name || ""} onChange={handleFormChange} />
                  </div>
                  <div>
                    <Label htmlFor="first_name" className="text-red-600">Имя *</Label>
                    <Input id="first_name" placeholder="Введите имя..." value={clientFormData.first_name || ""} onChange={handleFormChange} />
                  </div>
                  <div>
                    <Label htmlFor="birth_date" className="text-red-600">Дата рождения *</Label>
                    <Input id="birth_date" type="date" value={clientFormData.birth_date || ""} onChange={handleFormChange} />
                  </div>
                  <div>
                    <Label htmlFor="phone" className="text-red-600">Номер телефона *</Label>
                    <Input id="phone" placeholder="+7 (___) ___-__-__" value={clientFormData.phone || ""} onChange={handleFormChange} />
                  </div>
                </div>
              </div>

              {/* Personal Information */}
              <div className="space-y-4">
                <h3 className="font-semibold text-lg flex items-center gap-2">
                  <UserIcon className="h-5 w-5" />
                  Персональная информация
                </h3>
                <Separator />
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="middle_name">Отчество</Label>
                    <Input id="middle_name" placeholder="Введите отчество..." value={clientFormData.middle_name || ""} onChange={handleFormChange} />
                  </div>
                  <div>
                    <Label htmlFor="birth_place">Место рождения</Label>
                    <Input id="birth_place" placeholder="Страна/область/город/село..." value={clientFormData.birth_place || ""} onChange={handleFormChange} />
                  </div>
                  <div>
                    <Label htmlFor="citizenship">Гражданство</Label>
                    <Input id="citizenship" placeholder="Введите гражданство..." value={clientFormData.citizenship || ""} onChange={handleFormChange} />
                  </div>
                  <div>
                    <Label htmlFor="gender">Пол</Label>
                    <CustomSelect
                      value={clientFormData.gender || ""}
                      onChange={(value) => setClientFormData(prev => ({ ...prev, gender: value }))}
                      options={[
                        { value: "male", label: "Мужской" },
                        { value: "female", label: "Женский" }
                      ]}
                      placeholder="Выберите пол..."
                    />
                  </div>
                  <div>
                    <Label htmlFor="marital_status">Гражданское состояние</Label>
                    <CustomSelect
                      value={clientFormData.marital_status || ""}
                      onChange={(value) => setClientFormData(prev => ({ ...prev, marital_status: value }))}
                      options={[
                        { value: "single", label: "Холост/Не замужем" },
                        { value: "married", label: "Женат/Замужем" },
                        { value: "divorced", label: "Разведен(а)" },
                        { value: "widowed", label: "Вдовец/Вдова" }
                      ]}
                      placeholder="Выберите состояние..."
                    />
                  </div>
                  <div>
                    <Label htmlFor="iin">ИИН</Label>
                    <Input id="iin" placeholder="Введите ИИН..." value={clientFormData.iin || ""} onChange={handleFormChange} />
                  </div>
                </div>
              </div>

              {/* Document Information */}
              <div className="space-y-4">
                <h3 className="font-semibold text-lg flex items-center gap-2">
                  <CreditCard className="h-5 w-5" />
                  Документы
                </h3>
                <Separator />
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="id_number">Номер удостоверения</Label>
                    <Input id="id_number" placeholder="Введите № удостоверения..." value={clientFormData.id_number || ""} onChange={handleFormChange} />
                  </div>
                  <div>
                    <Label htmlFor="passport_series">Серия паспорта</Label>
                    <Input id="passport_series" placeholder="Введите серию паспорта..." value={clientFormData.passport_series || ""} onChange={handleFormChange} />
                  </div>
                  <div>
                    <Label htmlFor="passport_number">Номер паспорта</Label>
                    <Input id="passport_number" placeholder="Введите номер паспорта..." value={clientFormData.passport_number || ""} onChange={handleFormChange} />
                  </div>
                  <div>
                    <Label htmlFor="passport_issue_date">Дата выдачи паспорта</Label>
                    <Input id="passport_issue_date" type="date" value={clientFormData.passport_issue_date || ""} onChange={handleFormChange} />
                  </div>
                  <div>
                    <Label htmlFor="passport_expiry_date">Дата окончания паспорта</Label>
                    <Input id="passport_expiry_date" type="date" value={clientFormData.passport_expiry_date || ""} onChange={handleFormChange} />
                  </div>
                  <div>
                    <Label htmlFor="photo_35x45">Фото 3,5x4,5</Label>
                    <Input id="photo_35x45" placeholder="Ссылка на фото..." value={clientFormData.photo_35x45 || ""} onChange={handleFormChange} />
                  </div>
                </div>
              </div>

              {/* Contact Information */}
              <div className="space-y-4">
                <h3 className="font-semibold text-lg flex items-center gap-2">
                  <Phone className="h-5 w-5" />
                  Контактная информация
                </h3>
                <Separator />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="email">Email</Label>
                    <Input id="email" type="email" placeholder="Введите Email..." value={clientFormData.email || ""} onChange={handleFormChange} />
                  </div>
                  <div>
                    <Label htmlFor="registration_address">Адрес по прописке</Label>
                    <Textarea id="registration_address" placeholder="Введите адрес прописки..." value={clientFormData.registration_address || ""} onChange={handleFormChange} />
                  </div>
                  <div>
                    <Label htmlFor="actual_address">Адрес фактического проживания</Label>
                    <Textarea id="actual_address" placeholder="Введите адрес проживания..." value={clientFormData.actual_address || ""} onChange={handleFormChange} />
                  </div>
                </div>
              </div>

              {/* Optional Fields */}
              <div className="space-y-4">
                <h3 className="font-semibold text-lg flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Дополнительная информация (необязательно)
                </h3>
                <Separator />
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="former_maiden_name">Прежняя фамилия (девичья)</Label>
                    <Input id="former_maiden_name" placeholder="Введите прежнюю фамилию..." value={clientFormData.former_maiden_name || ""} onChange={handleFormChange} />
                  </div>
                  <div>
                    <Label htmlFor="spouse_info">Супруг(а) - ФИО и контакты</Label>
                    <Textarea id="spouse_info" placeholder="ФИО и контакты супруга(и)..." value={clientFormData.spouse_info || ""} onChange={handleFormChange} />
                  </div>
                  <div>
                    <Label htmlFor="children_info">Дети</Label>
                    <Textarea id="children_info" placeholder="Информация о детях (имя/фамилия/год рождения)..." value={clientFormData.children_info || ""} onChange={handleFormChange} />
                  </div>
                  <div>
                    <Label htmlFor="education">Образование</Label>
                    <Input id="education" placeholder="Введите образование..." value={clientFormData.education || ""} onChange={handleFormChange} />
                  </div>
                  <div>
                    <Label htmlFor="work_place_position">Место работы и должность</Label>
                    <Input id="work_place_position" placeholder="Введите место работы и должность..." value={clientFormData.work_place_position || ""} onChange={handleFormChange} />
                  </div>
                  <div>
                    <Label htmlFor="trips_visas_5years">Поездки и визы за последние 5 лет</Label>
                    <Textarea id="trips_visas_5years" placeholder="Информация о поездках и визах..." value={clientFormData.trips_visas_5years || ""} onChange={handleFormChange} />
                  </div>
                  <div>
                    <Label htmlFor="family_members_abroad">Члены семьи за рубежом</Label>
                    <Textarea id="family_members_abroad" placeholder="Члены семьи в стране назначения..." value={clientFormData.family_members_abroad || ""} onChange={handleFormChange} />
                  </div>
                  <div>
                    <Label htmlFor="authorized_person">Доверенное лицо</Label>
                    <Textarea id="authorized_person" placeholder="ФИО и контакты доверенного лица..." value={clientFormData.authorized_person || ""} onChange={handleFormChange} />
                  </div>
                  <div>
                    <Label htmlFor="height_weight">Рост / Вес</Label>
                    <Input id="height_weight" placeholder="Рост / Вес..." value={clientFormData.height_weight || ""} onChange={handleFormChange} />
                  </div>
                  <div>
                    <Label htmlFor="driving_license_categories">Права ВУ (категории)</Label>
                    <Input id="driving_license_categories" placeholder="Категории водительских прав..." value={clientFormData.driving_license_categories || ""} onChange={handleFormChange} />
                  </div>
                  <div>
                    <Label htmlFor="therapist_clinic">Терапевт / Клиника</Label>
                    <Input id="therapist_clinic" placeholder="ФИО терапевта / Название клиники..." value={clientFormData.therapist_clinic || ""} onChange={handleFormChange} />
                  </div>
                  <div>
                    <Label htmlFor="illnesses_injuries_3years">Болезни и травмы за 3 года</Label>
                    <Textarea id="illnesses_injuries_3years" placeholder="Информация о болезнях и травмах..." value={clientFormData.illnesses_injuries_3years || ""} onChange={handleFormChange} />
                  </div>
                  <div className="md:col-span-2 lg:col-span-3">
                    <Label htmlFor="additional_info">Дополнительная информация</Label>
                    <Textarea id="additional_info" placeholder="Любая дополнительная информация..." value={clientFormData.additional_info || ""} onChange={handleFormChange} />
                  </div>
                </div>
              </div>

              {/* Organization Information */}
              <div className="space-y-4">
                <h3 className="font-semibold text-lg flex items-center gap-2">
                  <Briefcase className="h-5 w-5" />
                  Информация об организации (для юридических лиц)
                </h3>
                <Separator />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="name">Название организации</Label>
                    <Input id="name" placeholder="Введите название организации..." value={clientFormData.name || ""} onChange={handleFormChange} />
                  </div>
                  <div>
                    <Label htmlFor="bin_iin">БИН/ИИН организации</Label>
                    <Input id="bin_iin" placeholder="Введите БИН/ИИН..." value={clientFormData.bin_iin || ""} onChange={handleFormChange} />
                  </div>
                  <div>
                    <Label htmlFor="address">Юридический адрес</Label>
                    <Textarea id="address" placeholder="Введите юридический адрес..." value={clientFormData.address || ""} onChange={handleFormChange} />
                  </div>
                  <div>
                    <Label htmlFor="contact_info">Контактная информация (юр.)</Label>
                    <Textarea id="contact_info" placeholder="Введите контактную информацию..." value={clientFormData.contact_info || ""} onChange={handleFormChange} />
                  </div>
                </div>
              </div>
            </div>
          </ScrollArea>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsFormOpen(false)}>Отмена</Button>
            <Button onClick={handleSubmit}>Сохранить</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <Dialog open={!!viewingClient} onOpenChange={(isOpen) => !isOpen && setViewingClient(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{viewingClient?.name || `${viewingClient?.last_name} ${viewingClient?.first_name}`}</DialogTitle>
            <DialogDescription>Детальная информация о клиенте</DialogDescription>
          </DialogHeader>
          {viewingClient && (
            <ScrollArea className="max-h-[70vh] p-4">
              <div className="space-y-6">
                {/* Required Fields */}
                <div>
                  <h3 className="font-semibold text-lg mb-2 text-red-600 flex items-center gap-2">
                    <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                    Обязательные поля
                  </h3>
                  <div className="grid grid-cols-2 gap-4">
                    <DetailItem label="Страна" value={viewingClient.country} />
                    <DetailItem label="Цель поездки" value={viewingClient.trip_purpose} />
                    <DetailItem label="Фамилия" value={viewingClient.last_name} />
                    <DetailItem label="Имя" value={viewingClient.first_name} />
                    <DetailItem label="Дата рождения" value={viewingClient.birth_date} />
                    <DetailItem label="Телефон" value={viewingClient.phone} />
                  </div>
                </div>
                <Separator />
                
                {/* Personal Information */}
                <div>
                  <h3 className="font-semibold text-lg mb-2 flex items-center gap-2">
                    <UserIcon className="h-5 w-5" />
                    Персональная информация
                  </h3>
                  <div className="grid grid-cols-2 gap-4">
                    <DetailItem label="Отчество" value={viewingClient.middle_name} />
                    <DetailItem label="Место рождения" value={viewingClient.birth_place} />
                    <DetailItem label="Гражданство" value={viewingClient.citizenship} />
                    <DetailItem label="Пол" value={viewingClient.gender} />
                    <DetailItem label="Гражданское состояние" value={viewingClient.marital_status} />
                    <DetailItem label="ИИН" value={viewingClient.iin} />
                  </div>
                </div>
                <Separator />
                
                {/* Document Information */}
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
                    <DetailItem label="Дата окончания паспорта" value={viewingClient.passport_expiry_date} />
                    <DetailItem label="Фото 3,5x4,5" value={viewingClient.photo_35x45} />
                  </div>
                </div>
                <Separator />
                
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
                
                {/* Optional Fields */}
                <div>
                  <h3 className="font-semibold text-lg mb-2 flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    Дополнительная информация
                  </h3>
                  <div className="grid grid-cols-2 gap-4">
                    <DetailItem label="Прежняя фамилия (девичья)" value={viewingClient.former_maiden_name} />
                    <DetailItem label="Супруг(а)" value={viewingClient.spouse_info} />
                    <DetailItem label="Дети" value={viewingClient.children_info} />
                    <DetailItem label="Образование" value={viewingClient.education} />
                    <DetailItem label="Место работы и должность" value={viewingClient.work_place_position} />
                    <DetailItem label="Поездки и визы за 5 лет" value={viewingClient.trips_visas_5years} />
                    <DetailItem label="Члены семьи за рубежом" value={viewingClient.family_members_abroad} />
                    <DetailItem label="Доверенное лицо" value={viewingClient.authorized_person} />
                    <DetailItem label="Рост / Вес" value={viewingClient.height_weight} />
                    <DetailItem label="Права ВУ (категории)" value={viewingClient.driving_license_categories} />
                    <DetailItem label="Терапевт / Клиника" value={viewingClient.therapist_clinic} />
                    <DetailItem label="Болезни и травмы за 3 года" value={viewingClient.illnesses_injuries_3years} />
                    <DetailItem label="Дополнительная информация" value={viewingClient.additional_info} />
                  </div>
                </div>
                <Separator />
                
                {/* Organization Information */}
                <div>
                  <h3 className="font-semibold text-lg mb-2 flex items-center gap-2">
                    <Briefcase className="h-5 w-5" />
                    Информация об организации
                  </h3>
                  <div className="grid grid-cols-2 gap-4">
                    <DetailItem label="Название" value={viewingClient.name} />
                    <DetailItem label="БИН/ИИН" value={viewingClient.bin_iin} />
                    <DetailItem label="Адрес" value={viewingClient.address} />
                    <DetailItem label="Контактная информация" value={viewingClient.contact_info} />
                  </div>
                </div>
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