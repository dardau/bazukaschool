"use client";
import { useState } from "react";
import { ArrowLeft, ArrowRight, Map as MapIcon } from "lucide-react";

const future = [
  ["will", <>The shop <b>will be relocated</b> from the east to the west.</>],
  ["is / are going to", <>The main road <b>is going to be widened</b>.</>],
  ["is / are planned to", <>A new parking lot <b>is planned to be constructed</b> next to the entrance.</>],
  ["is / are set to", <>The old factory <b>is set to be demolished</b> to make way for a park.</>],
  ["is / are to be", <>Two additional classrooms <b>are to be built</b> in the northern wing.</>],
] as const;
const vocabulary = [
  ["Что-то полностью снесли", "was removed · was demolished · was knocked down (здания и стены) · was cut down (деревья)"],
  ["Снесли и заменили", "A cafe was cleared to make way for a museum. · A cafe was removed to make way for a museum. · A cafe was replaced with a museum."],
  ["Изменили функцию здания или комнаты", "Размер, форма и расположение не меняются: was converted into · was transformed into · was turned into · was redesigned into"],
  ["Построили или добавили", "was added · was introduced (например, reception) · was built / constructed / erected · were planted (деревья)"],
  ["Расположение", "was located in · was placed in · was situated in · something occupied… (активный залог)"],
  ["Изменение размера", "was extended (удлинили) · was expanded / enlarged (расширили) · was reduced in size (уменьшили) · was shortened (укоротили)"],
  ["Переместили", "was relocated · was moved"],
] as const;
const titles = ["Writing Task 1: Maps", "Главная ловушка — времена", "Две карты в прошлом", "Прошлое и настоящее", "Что изменилось к настоящему?", "Настоящее и планы", "Как описать будущий план", "Future plans", "Directions & Location on Maps", "Стороны света и предлоги", "Vocabulary for maps"];
function MapImage({type, labels}: {type: "museum" | "housing" | "industrial" | "directions"; labels?: [string,string]}) {
  const files = {museum: "museum.jpg", housing: "housing.jpg", industrial: "industrial.png", directions: "industrial-alternate.png"};
  const alts = {museum: "Планы музея в 1998 и 2008 годах", housing: "План жилья в 2010 году и сейчас", industrial: "Промышленная территория сейчас и план новой жилой застройки с компасом", directions: "Промышленная территория и план жилой застройки с компасом"};
  return <figure className={'maps-figure maps-' + type}>
    {/* Original supplied illustration is intentionally displayed without editing. */}
    {/* eslint-disable-next-line @next/next/no-img-element */}
    <img src={'/materials/maps/' + files[type]} alt={alts[type]} />
    {labels && <><span className="maps-label maps-label-first">{labels[0]}</span><span className="maps-label maps-label-second">{labels[1]}</span></>}
  </figure>;
}
export default function MapsPresentation() {
  const [slide, setSlide] = useState(0);
  function change(next: number) { setSlide(Math.max(0, Math.min(titles.length - 1, next))); window.scrollTo({top: 0, behavior: 'auto'}); }
  return <section className="maps-lesson" aria-label="Презентация Writing Task 1 Maps">
    <a className="maps-back" href="#writing"><ArrowLeft size={16}/> Назад в Writing</a>
    <div className="maps-head"><div><span className="maps-kicker">BAZUKASCHOOL · WRITING TASK 1</span><h1>Maps</h1><p>Времена, расположение и лексика для описания карт.</p></div><div className="maps-counter" aria-live="polite">{slide + 1} <span>/ {titles.length}</span></div></div>
    <nav className="maps-index" aria-label="Слайды презентации">{titles.map((title,i)=><button key={title} type="button" aria-current={i===slide?'step':undefined} aria-label={`Слайд ${i+1}: ${title}`} onClick={()=>change(i)}>{i+1}</button>)}</nav>
    <article className="maps-slide" aria-live="polite"><div className="maps-slide-heading"><span>СЛАЙД {String(slide+1).padStart(2,'0')}</span><h2>{titles[slide]}</h2></div>
      {slide===0 && <div className="maps-cover"><div><p className="maps-cover-tag">IELTS ACADEMIC</p><h3>Видишь изменения?<br/><em>Расскажи о них.</em></h3><p>Научимся выбирать время, описывать направление и точно называть изменения на карте.</p></div><MapIcon aria-hidden="true" size={125} strokeWidth={1}/></div>}
      {slide===1 && <><p className="maps-lead">Посмотри на даты: какое время понадобится для каждой карты?</p><MapImage type="museum" /></>}
      {slide===2 && <><p className="maps-lead">Обе карты показывают завершённое время в прошлом.</p><MapImage type="museum" labels={['Past Simple','Past Simple']}/></>}
      {slide===3 && <><p className="maps-lead">Сравни план в 2010 году с тем, что есть сейчас.</p><MapImage type="housing" /></>}
      {slide===4 && <><p className="maps-lead">Прошлое описываем в Past Simple; изменения к настоящему — в Present Perfect: <b>has been built</b>.</p><MapImage type="housing" labels={['Past Simple','Present Perfect']}/></>}
      {slide===5 && <><p className="maps-lead">Первая карта показывает территорию сейчас, вторая — будущий план.</p><MapImage type="industrial" /></>}
      {slide===6 && <><p className="maps-lead">Для существующих объектов используем Present Simple; для плана — будущие конструкции.</p><MapImage type="industrial" labels={['Present Simple · факт','Future tenses']}/></>}
      {slide===7 && <div className="maps-future">{future.map(([name,example],i)=><div key={name}><span>{String(i+1).padStart(2,'0')}</span><div><h3>{name}</h3><p>{example}</p></div></div>)}</div>}
      {slide===8 && <><p className="maps-lead">Как описывать расположение: сначала найди на карте стороны света.</p><MapImage type="directions" /></>}
      {slide===9 && <div className="maps-directions"><MapImage type="directions" /><div><h3>1. Стороны света</h3><ul><li>In the north <span>(top)</span></li><li>In the south <span>(bottom)</span></li><li>In the east <span>(right)</span></li><li>In the west <span>(left)</span></li></ul><h3>2. Предлоги</h3><ul><li>In the middle of the</li><li>In the centre of the</li><li>Between</li><li>Next to</li><li>Along (the road / the shore)</li></ul></div></div>}
      {slide===10 && <div className="maps-vocab">{vocabulary.map(([title,words])=><section key={title}><h3>{title}</h3><p>{words}</p></section>)}</div>}
    </article>
    <div className="maps-controls"><button type="button" onClick={()=>change(slide-1)} disabled={slide===0}><ArrowLeft size={17}/> Назад</button><span>{slide+1} из {titles.length}</span><button type="button" onClick={()=>change(slide+1)} disabled={slide===titles.length-1}>Далее <ArrowRight size={17}/></button></div>
  </section>;
}
