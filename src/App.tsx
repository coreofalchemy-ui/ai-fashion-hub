import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Layout } from './components/shared/Layout';
import { Home } from './Home';
import { ModelGeneratorApp } from './apps/model-generator/ModelGeneratorApp';
import { DetailGeneratorApp } from './apps/detail-generator/DetailGeneratorApp';
import { ShoeEditorApp } from './apps/shoe-editor/ShoeEditorApp';
import { ContentGeneratorApp } from './apps/content-generator/ContentGeneratorApp';
import DetailStorageApp from './apps/detail-storage/DetailStorageApp';

function App() {
    return (
        <BrowserRouter>
            <Routes>
                <Route path="/" element={<Layout />}>
                    <Route index element={<Home />} />
                    <Route path="model-generator" element={<ModelGeneratorApp />} />
                    <Route path="detail-generator" element={<DetailGeneratorApp />} />
                    <Route path="shoe-editor" element={<ShoeEditorApp />} />
                    <Route path="content-generator" element={<ContentGeneratorApp />} />
                    <Route path="detail-storage" element={<DetailStorageApp />} />
                </Route>
            </Routes>
        </BrowserRouter>
    );
}

export default App;
