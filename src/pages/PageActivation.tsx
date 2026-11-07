import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { ShieldCheck, Lock, Mail, Loader2, CheckCircle2, ShieldAlert, Key, Sparkles, ChevronLeft, ArrowRight, User } from 'lucide-react';
import { db, auth } from '../lib/firebase';
import { collection, query, where, getDocs, doc, setDoc, deleteDoc } from 'firebase/firestore';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { toast } from 'react-hot-toast';
import { useAuthStore } from '../store/authStore';

const PageActivation = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const token = searchParams.get('token');

    const { finaliserActivation: activerCompte } = useAuthStore();
    const [chargement, setChargement] = useState(true);
    const [invitation, setInvitation] = useState<any>(null);
    const [motDePasse, setMotDePasse] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [etape, setEtape] = useState<'verification' | 'formulaire' | 'succes'>('verification');

    useEffect(() => {
        const verifierToken = async () => {
            const cleanToken = token?.trim();
            if (!cleanToken) {
                toast.error("Lien d'activation manquant ou invalide");
                navigate('/');
                return;
            }

            try {
                console.log("Vérification du token d'activation:", cleanToken);
                const q = query(collection(db, 'invitations'), where('token', '==', cleanToken));
                const snap = await getDocs(q);

                if (snap.empty) {
                    console.warn("Token non trouvé dans la collection 'invitations':", cleanToken);
                    toast.error("Ce lien d'activation est invalide ou a déjà été utilisé.");
                    navigate('/');
                    return;
                }

                const docSnap = snap.docs[0];
                const data = docSnap.data();

                // Vérification de l'expiration
                if (data.expire && Date.now() > data.expire) {
                    toast.error("Ce lien d'activation a expiré. Veuillez demander un nouveau lien.");
                    navigate('/');
                    return;
                }

                let finalData: any = { id: docSnap.id, ...data };

                // Fallback email dès le chargement pour l'affichage UI
                if (!finalData.email && !finalData.email_contact && finalData.etablissement_id) {
                    try {
                        const etabSnap = await getDocs(query(collection(db, 'etablissements'), where('__name__', '==', finalData.etablissement_id)));
                        if (!etabSnap.empty) {
                            const etabData = etabSnap.docs[0].data();
                            finalData.email = etabData.email_contact || etabData.email;
                        }
                    } catch (e) {
                        console.warn("Erreur chargement fallback email UI:", e);
                    }
                }

                setInvitation(finalData);
                setEtape('formulaire');
            } catch (err: any) {
                console.error("Erreur lors de la vérification du token:", err);
                toast.error("Erreur de connexion au serveur d'activation");
            } finally {
                setChargement(false);
            }
        };

        verifierToken();
    }, [token, navigate]);

    const finaliserActivation = async (e: React.FormEvent) => {
        e.preventDefault();
        if (motDePasse.length < 6) return toast.error("Minimum 6 caractères requis");
        if (motDePasse !== confirmPassword) return toast.error("Les mots de passe ne correspondent pas");

        setChargement(true);
        try {
            // 1. Récupération de l'email (gestion de la flexibilité des noms de champs)
            let email = invitation.email || invitation.email_contact;
            
            // Fallback: Si l'email est manquant dans l'invitation, on peut essayer de le récupérer via l'établissement
            if (!email && invitation.etablissement_id) {
                console.log("Email manquant dans l'invitation, tentative de récupération via l'établissement...");
                try {
                    const etabSnap = await getDocs(query(collection(db, 'etablissements'), where('__name__', '==', invitation.etablissement_id)));
                    if (!etabSnap.empty) {
                        const etabData = etabSnap.docs[0].data();
                        email = etabData.email_contact || etabData.email;
                        console.log("Email récupéré via l'établissement:", email);
                    }
                } catch (fallbackErr) {
                    console.error("Erreur lors du fallback email:", fallbackErr);
                }
            }

            if (!email) {
                throw new Error("L'adresse email est manquante dans l'invitation. Veuillez générer un nouveau lien.");
            }

            // Mettre à jour l'objet invitation avec l'email trouvé pour le store
            const invitationComplete = { ...invitation, email };

            // Utilisation de la méthode du store pour une activation propre
            await activerCompte(invitationComplete, motDePasse);

            setEtape('succes');
            toast.success("Compte activé avec succès ! Bienvenue.");
            
            setTimeout(() => {
                navigate('/tableau-de-bord');
            }, 3000);

        } catch (err: any) {
            console.error("Erreur d'activation détaillée:", err);
            if (err.code === 'auth/email-already-in-use') {
                toast.error("Un compte existe déjà avec cet email. Veuillez utiliser votre mot de passe habituel pour vous connecter.");
                setTimeout(() => navigate('/connexion'), 3000);
                return;
            }
            if (err.code === 'permission-denied') {
                toast.error("Erreur de droits : Impossible d'écrire votre profil. Contactez le support.");
            } else {
                toast.error(`Échec de l'activation : ${err.message || "Erreur inconnue"}`);
            }
        } finally {
            setChargement(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 font-['Inter',sans-serif] flex items-center justify-center p-6 relative overflow-hidden selection:bg-blue-100">
            {/* Background decoration */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0">
                <div className="absolute -top-[10%] -left-[10%] w-[50%] h-[50%] bg-blue-100 rounded-full blur-[120px] opacity-40" />
                <div className="absolute -bottom-[10%] -right-[10%] w-[50%] h-[50%] bg-orange-100 rounded-full blur-[120px] opacity-40" />
            </div>

            <div className="max-w-4xl w-full bg-white rounded-[3.5rem] shadow-[0_40px_100px_-20px_rgba(30,58,138,0.15)] overflow-hidden relative z-10 border border-white flex flex-col md:flex-row">
                
                {/* Left Side: Identity Check */}
                <div className="md:w-[40%] bg-[#1E3A8A] p-12 text-white flex flex-col justify-between relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/20 rounded-full blur-3xl -mr-32 -mt-32" />
                    
                    <div className="space-y-10 relative z-10">
                        <div className="flex items-center gap-4">
                            <img src="/logo_gestcave.png" alt="Logo" className="w-12 h-12 object-contain" />
                            <h1 className="text-xl font-black tracking-tight uppercase">GestCave Pro</h1>
                        </div>
                    </div>

                    <div className="space-y-6 relative z-10">
                        <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center border border-white/10 shadow-lg text-[#FF7A00]">
                            <Key size={24} />
                        </div>
                        <h2 className="text-4xl font-black leading-tight tracking-tight uppercase">
                            Activation de <br/>
                            <span className="text-[#FF7A00]">votre accès.</span>
                        </h2>
                        {invitation && (
                            <p className="text-blue-100/60 leading-relaxed font-medium">
                                Activation du compte pour <span className="text-white font-black">{invitation.email || invitation.email_contact || "E-mail inconnu"}</span>. 
                                <br />
                                Établissement : <span className="font-bold text-white">{invitation.nom_etablissement || "Chargement..."}</span>
                            </p>
                        )}
                        <p className="text-blue-100/60 leading-relaxed font-medium">
                            Sécurisez votre espace administrateur en configurant votre clé de sécurité personnelle.
                        </p>
                    </div>

                    <div className="pt-8 border-t border-white/10 flex items-center gap-4 relative z-10">
                        <div className="w-8 h-8 bg-white/5 rounded-lg flex items-center justify-center text-emerald-400">
                            <ShieldCheck size={18} />
                        </div>
                        <span className="text-[10px] font-black text-blue-100/40 uppercase tracking-[0.2em]">Sécurité de Grade Bancaire</span>
                    </div>
                </div>

                {/* Right Side: Process Area */}
                <div className="md:w-[60%] p-12 md:p-20 bg-white">
                    {etape === 'verification' && (
                        <div className="h-full flex flex-col items-center justify-center text-center space-y-8 animate-in fade-in duration-700">
                            <Loader2 size={64} className="text-[#1E3A8A] animate-spin" />
                            <div>
                                <h3 className="text-2xl font-black text-[#1E3A8A] uppercase tracking-tight mb-2">Vérification du lien</h3>
                                <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px]">Liaison avec le serveur sécurisé...</p>
                            </div>
                        </div>
                    )}

                    {etape === 'formulaire' && (
                        <div className="space-y-10 animate-in slide-in-from-right duration-500">
                            <div className="space-y-4">
                                <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-50 rounded-full text-[#1E3A8A] text-[10px] font-black uppercase tracking-widest border border-blue-100">
                                   <User size={12} className="text-[#FF7A00]" /> Vérifié
                                </div>
                                <h3 className="text-3xl font-black text-[#1E3A8A] tracking-tighter uppercase leading-none">Bonjour {invitation.nom}</h3>
                                <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">Configurez votre mot de passe pour {invitation.email}</p>
                            </div>

                            <form onSubmit={finaliserActivation} className="space-y-6">
                                <div className="space-y-3">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Clé de Sécurité (Mot de Passe)</label>
                                    <div className="relative group">
                                        <div className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-[#1E3A8A] transition-all">
                                            <Lock size={22} />
                                        </div>
                                        <input 
                                            required 
                                            type="password" 
                                            value={motDePasse} 
                                            onChange={e => setMotDePasse(e.target.value)}
                                            placeholder="Minimum 6 caractères"
                                            className="w-full h-18 bg-slate-50 border-2 border-slate-100 rounded-[1.5rem] pl-16 pr-8 outline-none focus:border-[#1E3A8A] focus:bg-white transition-all font-bold text-[#1E3A8A] shadow-sm" 
                                        />
                                    </div>
                                </div>

                                <div className="space-y-3">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Confirmation de la Clé</label>
                                    <div className="relative group">
                                        <div className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-[#1E3A8A] transition-all">
                                            <ShieldCheck size={22} />
                                        </div>
                                        <input 
                                            required 
                                            type="password" 
                                            value={confirmPassword} 
                                            onChange={e => setConfirmPassword(e.target.value)}
                                            placeholder="Confirmez votre mot de passe"
                                            className="w-full h-18 bg-slate-50 border-2 border-slate-100 rounded-[1.5rem] pl-16 pr-8 outline-none focus:border-[#1E3A8A] focus:bg-white transition-all font-bold text-[#1E3A8A] shadow-sm" 
                                        />
                                    </div>
                                </div>

                                <button 
                                    type="submit" 
                                    disabled={chargement}
                                    className="w-full h-20 bg-[#1E3A8A] text-white rounded-[2rem] font-black uppercase tracking-widest text-sm shadow-2xl shadow-blue-900/20 hover:bg-blue-800 transition-all flex items-center justify-center gap-4 group active:scale-[0.98]"
                                >
                                    {chargement ? <Loader2 className="animate-spin" /> : (
                                        <>
                                            Activer mon espace
                                            <ArrowRight size={22} className="group-hover:translate-x-2 transition-transform text-[#FF7A00]" />
                                        </>
                                    )}
                                </button>
                            </form>
                        </div>
                    )}

                    {etape === 'succes' && (
                        <div className="h-full flex flex-col items-center justify-center text-center space-y-8 animate-in zoom-in-95 duration-700">
                            <div className="w-24 h-24 bg-emerald-50 text-emerald-500 rounded-[2.5rem] flex items-center justify-center shadow-xl shadow-emerald-500/10">
                                <CheckCircle2 size={48} />
                            </div>
                            <div className="space-y-4">
                                <h3 className="text-3xl font-black text-[#1E3A8A] uppercase tracking-tighter">Accès Activé !</h3>
                                <p className="text-slate-400 font-medium text-lg leading-relaxed max-w-[300px]">
                                    Votre espace est désormais prêt. Redirection vers la page de connexion...
                                </p>
                            </div>
                            <button onClick={() => navigate('/connexion')} className="w-full h-16 bg-[#1E3A8A] text-white rounded-[1.5rem] font-black uppercase tracking-widest text-xs">
                                Se connecter maintenant
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default PageActivation;
