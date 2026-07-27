import { Bot, ExternalLink, Flame, Rocket, ShieldCheck, Sparkles, Wallet } from 'lucide-react';
import RitualDinoGame from '../components/RitualDinoGame';
import {
  CHAIN_DESCRIPTION,
  CHAIN_ID,
  DOCS_URL,
  EXPLORER_URL,
  FAUCET_URL,
  RPC_HTTP_URL,
  SKILLS_URL,
} from '../config/network';

const deploySteps = [
  'Fund a wallet with faucet RITUAL and connect it to this app.',
  'Use Ritual RPC in your Foundry or Hardhat config and deploy contracts to chain ID 1979.',
  'Verify transactions and deployed addresses in Ritual Explorer.',
  'For agent-native apps, study Ritual docs and the ritual-dapp-skills microsite to design around precompiles, Scheduler, and RitualWallet.',
];

const commands = [
  'forge create src/YourContract.sol:YourContract --rpc-url https://rpc.ritualfoundation.org --private-key $PRIVATE_KEY',
  'cast send 0xYourContract "yourFunction()" --rpc-url https://rpc.ritualfoundation.org --private-key $PRIVATE_KEY',
];

export default function RitualLab() {
  return (
    <div className="px-4 sm:px-6 py-8 space-y-6">
      <section className="hero-banner text-white">
        <div className="relative z-10 max-w-3xl">
          <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.22em]">
            <Sparkles className="w-3.5 h-3.5" />
            Ritual Lab
          </div>
          <h1 className="mt-4 text-3xl sm:text-5xl font-black leading-tight">The Daily Cup, rebuilt for Ritual.</h1>
          <p className="mt-3 text-sm sm:text-base text-slate-100 max-w-2xl">
            {CHAIN_DESCRIPTION} This hub gives users one place to add the network, claim faucet funds, learn deployment flow, and take a quick Ritual quiz while the next block lands.
          </p>
          <div className="mt-5 flex flex-wrap gap-3 text-sm">
            <a href={FAUCET_URL} target="_blank" rel="noreferrer" className="btn-primary !bg-white !text-slate-950 hover:!bg-orange-100">
              <Flame className="w-4 h-4" />
              Claim faucet
            </a>
            <a href={EXPLORER_URL} target="_blank" rel="noreferrer" className="btn-secondary !bg-white/10 !border-white/20 !text-white hover:!bg-white/15">
              <Rocket className="w-4 h-4" />
              Open explorer
            </a>
          </div>
        </div>
      </section>

      <section className="grid lg:grid-cols-[1.1fr_0.9fr] gap-6">
        <div className="card p-6">
          <div className="flex items-center gap-2 mb-3">
            <Rocket className="w-5 h-5 text-orange-500" />
            <h2 className="text-lg font-bold text-slate-900">Deploy on Ritual</h2>
          </div>
          <p className="text-sm text-slate-500 mb-4">
            Ritual Testnet uses native <strong>RITUAL</strong> and chain ID <strong>{CHAIN_ID}</strong>. For a straightforward EVM deployment flow, point your toolchain at the Ritual RPC and fund the deployer wallet first.
          </p>
          <div className="space-y-3 mb-5">
            {deploySteps.map((step, index) => (
              <div key={step} className="flex items-start gap-3 rounded-xl bg-slate-50 p-3">
                <div className="mt-0.5 flex h-6 w-6 items-center justify-center rounded-full bg-orange-100 text-[11px] font-bold text-orange-700">
                  {index + 1}
                </div>
                <p className="text-sm text-slate-700">{step}</p>
              </div>
            ))}
          </div>

          <div className="rounded-2xl bg-slate-950 p-4 text-slate-100">
            <p className="text-xs uppercase tracking-[0.24em] text-slate-400 mb-3">Starter commands</p>
            {commands.map(command => (
              <pre key={command} className="overflow-x-auto text-xs font-mono py-2">
                {command}
              </pre>
            ))}
          </div>
        </div>

        <div className="card p-6">
          <div className="flex items-center gap-2 mb-3">
            <Bot className="w-5 h-5 text-cyan-500" />
            <h2 className="text-lg font-bold text-slate-900">Why Ritual is deeper than a network switch</h2>
          </div>
          <div className="space-y-3 text-sm text-slate-600">
            <p>Ritual is not just “another RPC”. Its docs position the chain as an AI-native L1 with precompiles for HTTP, agents, privacy, inference, and scheduling.</p>
            <p>This app now treats payments as native Ritual settlement and frames the merchant experience around Ritual’s identity: faucet, explorer, deploy pipeline, and agent-first storytelling.</p>
            <p>That gives you a cleaner next step if you later want to replace the demo agent layer with actual Ritual-native contract flows.</p>
          </div>
          <div className="mt-5 space-y-2 text-sm">
            <a href={DOCS_URL} target="_blank" rel="noreferrer" className="flex items-center justify-between rounded-xl border border-slate-200 px-4 py-3 hover:bg-slate-50">
              <span className="flex items-center gap-2"><ShieldCheck className="w-4 h-4 text-orange-500" /> Ritual docs</span>
              <ExternalLink className="w-4 h-4 text-slate-400" />
            </a>
            <a href={SKILLS_URL} target="_blank" rel="noreferrer" className="flex items-center justify-between rounded-xl border border-slate-200 px-4 py-3 hover:bg-slate-50">
              <span className="flex items-center gap-2"><Bot className="w-4 h-4 text-cyan-500" /> ritual-dapp-skills</span>
              <ExternalLink className="w-4 h-4 text-slate-400" />
            </a>
            <a href={EXPLORER_URL} target="_blank" rel="noreferrer" className="flex items-center justify-between rounded-xl border border-slate-200 px-4 py-3 hover:bg-slate-50">
              <span className="flex items-center gap-2"><Wallet className="w-4 h-4 text-emerald-500" /> Ritual Explorer</span>
              <ExternalLink className="w-4 h-4 text-slate-400" />
            </a>
          </div>
          <div className="mt-5 rounded-xl bg-orange-50 p-4 text-sm text-orange-900">
            <p className="font-semibold">Network snapshot</p>
            <p className="mt-1">RPC: {RPC_HTTP_URL}</p>
            <p>Explorer: {EXPLORER_URL}</p>
            <p>Currency: RITUAL</p>
          </div>
        </div>
      </section>

      <RitualDinoGame />
    </div>
  );
}

