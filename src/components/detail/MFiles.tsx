'use client'

import { useState, useEffect, useRef } from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle
} from "@/components/ui/card";
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import { AlertTriangle, ExternalLink, FileSymlink, Loader2 } from 'lucide-react';
import Swal from 'sweetalert2';
import axios from 'axios';
import { Alert, AlertDescription } from '../ui/alert';
import { TransactionNonInsurance } from '@/types/newDots';

interface DraftFile {
  id: string;
  file: File;
  mfilesClass: string;
  className: string;
  status: 'not_uploaded';
}

interface ClassCode {
  ref_code: string;
  description: string;
}

interface UploadedFile {
  dots_number: string;
  seq_nbr: number;
  file_name: string;
  group_code: string;
  class_code: string;
  class_name: string;
  is_uploaded: boolean;
  created_date: string;
  modified_date: string;
}

export default function MFilesSection({
  setIsUploadMfiles,
  formData,
  group_code,
  isAdmin = false,
  emailInputter,
}: {
  setIsUploadMfiles: (value: boolean | undefined) => void;
  formData: TransactionNonInsurance;
  group_code: string | null;
  isAdmin?: boolean;
  emailInputter: string;
}) {
  const [draftFiles, setDraftFiles] = useState<DraftFile[]>([]);
  const [openPopover, setOpenPopover] = useState<{ [key: string]: boolean }>({});
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [classCodes, setClassCodes] = useState<ClassCode[]>([]);
  const [filteredClassCodes, setFilteredClassCodes] = useState<ClassCode[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const DotsEndPoint = process.env.NEXT_PUBLIC_DOTS_BE_END_POINT;
  const SapEndPoint = process.env.NEXT_PUBLIC_SAP_END_POINT;

  const fetchUploadedFiles = async () => {
    try {
      setIsLoading(true);
      const response = await axios.get(`${DotsEndPoint}/mfiles-upload-file?dots_number=${formData.dots_number}`);
      if(response.status === 404) console.log("Empty mfiels upload")
      if((response.data).length > 0){
        setIsUploadMfiles(true);
      }
      setUploadedFiles(response.data);
    } catch (error) {
      console.error('Error fetching uploaded files:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (formData.dots_number) {
      fetchUploadedFiles();
    }
  }, [formData.dots_number]);

  // Fetch class codes only once when component mounts
  useEffect(() => {
    const fetchClassCodes = async () => {
      try {
        const response = await axios.get(`${DotsEndPoint}/class-code/m-files`);
        const data = response.data.data;
        setClassCodes(data);
        setFilteredClassCodes(data);
      } catch (error) {
        console.error('Error fetching class codes:', error);
        Swal.fire({
          title: 'Error',
          text: 'Failed to fetch class codes',
          icon: 'error'
        });
      }
    };

    fetchClassCodes();
  }, []);

  // Local search filtering
  useEffect(() => {
    const filtered = classCodes.filter(classCode => 
      classCode.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      classCode.ref_code.toLowerCase().includes(searchQuery.toLowerCase())
    );
    setFilteredClassCodes(filtered);
  }, [searchQuery, classCodes]);

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.stopPropagation();
    setSearchQuery(e.target.value);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      const newDraftFiles = Array.from(files).map(file => ({
        id: crypto.randomUUID(),
        file,
        mfilesClass: '',
        className: '',
        status: 'not_uploaded' as const
      }));
      setDraftFiles(prev => [...prev, ...newDraftFiles]);
    }
    e.target.value = '';
  };

  const handleDeleteFile = async (dots_number: string, seq_nbr: number) => {
    const result = await Swal.fire({
      title: 'Are you sure?',
      text: "You won't be able to revert this!",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Yes, delete it!'
    });

    if (result.isConfirmed) {
      try {
        await axios.delete(`${DotsEndPoint}/mfiles-upload-file/${dots_number}/${seq_nbr}`);
        setUploadedFiles(prev => prev.filter(file => file.seq_nbr !== seq_nbr));
        Swal.fire(
          'Deleted!',
          'File has been deleted.',
          'success'
        );
      } catch (error) {
        console.error('Delete error:', error);
        Swal.fire({
          title: 'Error',
          text: 'Failed to delete file',
          icon: 'error'
        });
      }
    }
  };

  const handleCancelDraft = (id: string) => {
    setDraftFiles(prev => prev.filter(draft => draft.id !== id));
  };

  const handleClassChange = (id: string, code: string) => {
    const selectedClass = classCodes.find(c => c.ref_code === code);
    setDraftFiles(prev => 
      prev.map(draft => 
        draft.id === id 
          ? {
              ...draft, 
              mfilesClass: code,
              className: selectedClass?.description || ''
            } 
          : draft
      )
    );
    // Reset search query after selection
    setSearchQuery('');
  };

  const handleUploadMfiles = async (id: string) => {
    const draftFile = draftFiles.find(draft => draft.id === id);
    if (!draftFile?.mfilesClass) {
      Swal.fire({
        title: 'Error',
        text: 'Please select MFiles Class first',
        icon: 'error'
      });
      return;
    }
  
    const isDuplicate = uploadedFiles.some(
      file => file.file_name.toLowerCase() === draftFile.file.name.toLowerCase()
    );
  
    if (isDuplicate) {
      Swal.fire({
        title: 'Error',
        text: 'A file with this name already exists. Please rename the file before uploading.',
        icon: 'error'
      });
      return;
    }
  
    const result = await Swal.fire({
      title: 'Confirm Upload',
      text: 'Are you sure you want to upload this file?',
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Yes, upload it!',
      cancelButtonText: 'No, cancel'
    });
  
    if (result.isConfirmed) {
      try {
        const formDataUpload = new FormData();
        formDataUpload.append('file', draftFile.file);
  
        const uploadResponse = await axios.post(
          `${SapEndPoint}/Mfiles/Upload/${group_code}/${draftFile.mfilesClass}/${formData.dots_number}`, 
          formDataUpload
        );
  
        if (uploadResponse.status !== 200) throw new Error('File upload failed');
  
        const metadata = {
          dots_number: formData.dots_number,
          file_name: draftFile.file.name,
          group_code,
          class_code: draftFile.mfilesClass,
          class_name: draftFile.className,
          is_uploaded: true,
        };
  
        const metadataResponse = await axios.post(`${DotsEndPoint}/mfiles-upload-file`, metadata);
        if (metadataResponse.status !== 201 && metadataResponse.status !== 200) throw new Error('Metadata upload failed');
  
        Swal.fire({
          title: 'Success',
          text: 'File uploaded successfully',
          icon: 'success'
        });
        await fetchUploadedFiles();
  
        setDraftFiles(prev => prev.filter(draft => draft.id !== id));
  
      } catch (error) {
        console.error('Upload error:', error);
        Swal.fire({
          title: 'Error',
          text: 'Failed to upload file',
          icon: 'error'
        });
      }
    }
  };

  if (!group_code || isLoading) {
    return (
      <div className="w-full bg-white rounded-lg p-6 mb-8 flex justify-center items-center h-40">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
        <span className="ml-2">Loading Mfiles...</span>
      </div>
    );
  }

  return (
    <Card className="shadow-lg md:m-0 m-0">
      <CardHeader className="border-b">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <FileSymlink className="text-black" />
            <CardTitle className="text-lg text-black">M-Files</CardTitle>
          </div>
          {uploadedFiles.length > 0 && (
            <Button
              variant="outline"
              className="flex items-center gap-2"
              // onClick={() => window.open(`${process.env.NEXT_PUBLIC_MFILES_END_POINT}/Default.aspx#7B5D8FF911-CE06-4B27-8311-B0AD764921C0%7D/search?query=${formData.dots_number}`, '_blank')}
              onClick={() => window.open(`${process.env.NEXT_PUBLIC_MFILES_END_POINT}/#/vault/{FC9DB552-CAFC-4487-B02F-11836825343D}/search?query=${formData.dots_number}`, '_blank')}
            >
              <ExternalLink className="h-4 w-4" />
              View M-Files
            </Button>
          )}
        </div>
      </CardHeader>
      
      <CardContent className="p-6">
        <Alert className="mb-6 bg-blue-50 border-blue-200">
          <AlertTriangle className="h-4 w-4 text-blue-500" />
          <AlertDescription className="text-blue-700">
            Please contact Master Data Management team if you encounter any issues with file uploads or need assistance with file deletion.
          </AlertDescription>
        </Alert>

        <div className="space-y-4">
          {uploadedFiles.length === 0 && draftFiles.length === 0 ? (
            <div className="space-y-4">
              <div className="text-center p-8 bg-gray-50 rounded-lg border border-gray-200">
                <p className="text-gray-600 font-medium">Data not found</p>
              </div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-4 font-medium text-gray-700">MFiles Class</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700">File Name</th>
                    <th className="py-3 px-4 font-medium text-gray-700 text-center items-center">Status</th>
                    {isAdmin && (
                      <th className="text-center py-3 px-4 font-medium text-gray-700">Action</th>
                    )}
                  </tr>
                </thead>
                <tbody>
                  {uploadedFiles.map((file) => (
                    <tr key={`uploaded-${file.seq_nbr}`} className="border-b">
                      <td className="py-3 px-4">{file.class_name}</td>
                      <td className="py-3 px-4 text-gray-700">{file.file_name}</td>
                      <td className="py-3 px-4 text-center items-center">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          Uploaded
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center items-center">
                        {isAdmin && (
                          <Button 
                            variant="destructive" 
                            size="sm"
                            onClick={() => handleDeleteFile(file.dots_number, file.seq_nbr)}
                          >
                            Delete
                          </Button>
                        )}
                      </td>
                    </tr>
                  ))}
                  
                  {draftFiles.map(draft => (
                    <tr key={draft.id} className="border-b">
                      <td className="py-3 px-4">
                        <Popover 
                          open={openPopover[draft.id]} 
                          onOpenChange={(open) => {
                            setOpenPopover(prev => ({...prev, [draft.id]: open}));
                            if (!open) {
                              setSearchQuery('');
                            }
                          }}
                        >
                          <PopoverTrigger asChild>
                            <Button 
                              variant="outline" 
                              className="w-[250px] justify-between"
                              role="combobox"
                            >
                              <span className='truncate'>
                                {draft.className || "Select class..."}  
                              </span>
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-[200px] p-0">
                            <Command>
                              <CommandInput 
                                placeholder="Search class..." 
                                value={searchQuery}
                                onValueChange={setSearchQuery}
                              />
                              <CommandList className='max-h-[25vh]'>
                                <CommandEmpty>No class found.</CommandEmpty>
                                <CommandGroup>
                                  {filteredClassCodes.map((classCode) => (
                                    <CommandItem
                                      key={classCode.ref_code}
                                      onSelect={() => {
                                        handleClassChange(draft.id, classCode.ref_code);
                                        setOpenPopover(prev => ({...prev, [draft.id]: false}));
                                        setSearchQuery('');
                                      }}
                                    >
                                      {classCode.description}
                                    </CommandItem>
                                  ))}
                                </CommandGroup>
                              </CommandList>
                            </Command>
                          </PopoverContent>
                        </Popover>
                      </td>
                      <td className="py-3 px-4 text-gray-700">{draft.file.name}</td>
                      <td className="py-3 px-4 text-center items-center">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                          Not uploaded
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center items-center flex gap-2">
                        <div className="flex gap-2 mx-auto">
                          <Button 
                            variant="destructive" 
                            size="sm"
                            onClick={() => handleCancelDraft(draft.id)}
                          >
                            Cancel
                          </Button>
                          <Button
                            type="button"
                            className="bg-blue-500 hover:bg-blue-600 text-white"
                            size="sm"
                            onClick={() => handleUploadMfiles(draft.id)}
                            disabled={!draft.mfilesClass}
                          >
                            Upload file
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          {((formData.created_by === emailInputter)&&((formData.status === '1010' || 
                (formData.status === '2010' && formData.trx_type === '2' && formData.form_type === 'Cash in Advance') || (formData.status === '1060' && formData.trx_type === '2' && formData.form_type === 'Cash in Advance') || (formData.status === '2010' && formData.trx_type === '2' && formData.form_type === 'Disbursement')))) && (
            <>
              <div className="flex items-center gap-3">
                <label className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 cursor-pointer">
                  <span>Choose Files</span>
                  <input 
                      type="file" 
                      className="hidden" 
                      onChange={handleFileSelect}
                      multiple
                    />
                  </label>
                  {uploadedFiles.length == 0 && (
                    <span className="text-sm text-gray-500">No file chosen</span>
                  )}
              </div>
            </>
          )}
          </div>
        </CardContent>
      </Card>
    );
}